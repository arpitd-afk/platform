import { v4 as uuidv4 } from "uuid";
import { query, transaction } from "../lib/db";
import logger from "../lib/logger";
import {
  Tournament,
  TournamentMatch,
  TournamentStanding,
} from "../types/models";
import { ActivityLogService } from "./activityLogService";
import { NotificationService } from "./notificationService";

export class TournamentService {
  /**
   * Swiss Pairing Algorithm
   */
  static generateSwissPairings(players: any[], existingMatches: any[]) {
    const played = new Set(
      existingMatches.map((m) => `${m.white_id}:${m.black_id}`),
    );
    const hasPlayed = (a: string, b: string) =>
      played.has(`${a}:${b}`) || played.has(`${b}:${a}`);

    const pool = [...players];
    const pairs: any[] = [];
    const paired = new Set();

    let byePlayer = null;
    if (pool.length % 2 === 1) {
      for (let i = pool.length - 1; i >= 0; i--) {
        if (!pool[i].had_bye) {
          byePlayer = pool[i];
          pool.splice(i, 1);
          break;
        }
      }
      if (!byePlayer) {
        byePlayer = pool.pop();
      }
      pairs.push({
        white_id: byePlayer.player_id,
        black_id: null,
        is_bye: true,
      });
      paired.add(byePlayer.player_id);
    }

    for (let i = 0; i < pool.length; i++) {
      if (paired.has(pool[i].player_id)) continue;

      let found = false;
      for (let j = i + 1; j < pool.length; j++) {
        if (paired.has(pool[j].player_id)) continue;
        if (!hasPlayed(pool[i].player_id, pool[j].player_id)) {
          const [white, black] =
            (pool[i].whites_count || 0) <= (pool[j].whites_count || 0)
              ? [pool[i], pool[j]]
              : [pool[j], pool[i]];
          pairs.push({
            white_id: white.player_id,
            black_id: black.player_id,
            is_bye: false,
          });
          paired.add(pool[i].player_id);
          paired.add(pool[j].player_id);
          found = true;
          break;
        }
      }

      // If no opponent found that they haven't played, pair with ANY available
      if (!found) {
        for (let j = i + 1; j < pool.length; j++) {
          if (!paired.has(pool[j].player_id)) {
            pairs.push({
              white_id: pool[i].player_id,
              black_id: pool[j].player_id,
              is_bye: false,
            });
            paired.add(pool[i].player_id);
            paired.add(pool[j].player_id);
            break;
          }
        }
      }
    }
    return pairs;
  }

  /**
   * Round Robin Pairing Algorithm
   */
  static generateRoundRobinPairings(
    playerIds: (string | null)[],
    round: number,
    totalRounds: number,
  ) {
    const n =
      playerIds.length % 2 === 0 ? playerIds.length : playerIds.length + 1;
    const ids = [...playerIds];
    if (ids.length % 2 === 1) ids.push(null);

    const fixed = ids[0];
    const rotating = ids.slice(1);
    const rotated = [];
    const shift = (round - 1) % (n - 1);
    for (let i = 0; i < rotating.length; i++) {
      rotated.push(rotating[(i + shift) % rotating.length]);
    }
    const circle = [fixed, ...rotated];

    const pairs: any[] = [];
    for (let i = 0; i < n / 2; i++) {
      const white = circle[i];
      const black = circle[n - 1 - i];
      if (white && black) {
        pairs.push({
          white_id: round % 2 === 0 ? black : white,
          black_id: round % 2 === 0 ? white : black,
          is_bye: false,
        });
      } else {
        const byePlayer = white || black;
        if (byePlayer)
          pairs.push({ white_id: byePlayer, black_id: null, is_bye: true });
      }
    }
    return pairs;
  }

  /**
   * Knockout Pairing Algorithm
   */
  static generateKnockoutPairings(playersSorted: any[], round: number) {
    const pairs: any[] = [];
    const n = playersSorted.length;
    for (let i = 0; i < Math.floor(n / 2); i++) {
      pairs.push({
        white_id: playersSorted[i].player_id,
        black_id: playersSorted[n - 1 - i].player_id,
        is_bye: false,
      });
    }
    if (n % 2 === 1)
      pairs.push({
        white_id: playersSorted[Math.floor(n / 2)].player_id,
        black_id: null,
        is_bye: true,
      });
    return pairs;
  }

  /**
   * Rollback match scores in standings
   */
  static async rollbackMatchScores(m: any) {
    if (!m.white_id || m.is_bye) return;
    const ws = parseFloat(m.white_score) || 0;
    const bs = parseFloat(m.black_score) || 0;

    if (m.white_id) {
      await query(
        `UPDATE tournament_standings SET score = GREATEST(COALESCE(score, 0) - $1, 0),
          wins = GREATEST(COALESCE(wins, 0) - $2, 0), draws = GREATEST(COALESCE(draws, 0) - $3, 0), losses = GREATEST(COALESCE(losses, 0) - $4, 0)
         WHERE tournament_id=$5 AND player_id=$6`,
        [
          ws,
          ws === 1 ? 1 : 0,
          ws === 0.5 ? 1 : 0,
          ws === 0 ? 1 : 0,
          m.tournament_id,
          m.white_id,
        ],
      );
    }
    if (m.black_id) {
      await query(
        `UPDATE tournament_standings SET score = GREATEST(COALESCE(score, 0) - $1, 0),
          wins = GREATEST(COALESCE(wins, 0) - $2, 0), draws = GREATEST(COALESCE(draws, 0) - $3, 0), losses = GREATEST(COALESCE(losses, 0) - $4, 0)
         WHERE tournament_id=$5 AND player_id=$6`,
        [
          bs,
          bs === 1 ? 1 : 0,
          bs === 0.5 ? 1 : 0,
          bs === 0 ? 1 : 0,
          m.tournament_id,
          m.black_id,
        ],
      );
    }
  }

  /**
   * Recalculate Buchholz tiebreak
   */
  static async recalcBuchholz(tournamentId: string) {
    const matches = await query(
      `SELECT white_id, black_id FROM tournament_matches WHERE tournament_id=$1 AND is_bye=false AND status='completed'`,
      [tournamentId],
    );
    const scores = await query(
      `SELECT player_id, score FROM tournament_standings WHERE tournament_id=$1`,
      [tournamentId],
    );
    const scoreMap: Record<string, number> = {};
    for (const s of scores.rows) scoreMap[s.player_id] = parseFloat(s.score);

    const buchholz: Record<string, number> = {};
    for (const m of matches.rows) {
      if (m.white_id && m.black_id) {
        buchholz[m.white_id] =
          (buchholz[m.white_id] || 0) + (scoreMap[m.black_id] || 0);
        buchholz[m.black_id] =
          (buchholz[m.black_id] || 0) + (scoreMap[m.white_id] || 0);
      }
    }
    for (const [pid, buch] of Object.entries(buchholz)) {
      await query(
        `UPDATE tournament_standings SET tiebreak1=$1 WHERE tournament_id=$2 AND player_id=$3`,
        [buch, tournamentId, pid],
      );
    }
  }

  /**
   * Re-rank tournament standings
   */
  static async rerank(tournamentId: string) {
    const standings = await query(
      `SELECT player_id FROM tournament_standings
       WHERE tournament_id=$1 ORDER BY score DESC, tiebreak1 DESC`,
      [tournamentId],
    );
    for (let i = 0; i < standings.rows.length; i++) {
      await query(
        `UPDATE tournament_standings SET rank=$1 WHERE tournament_id=$2 AND player_id=$3`,
        [i + 1, tournamentId, standings.rows[i].player_id],
      );
    }
  }

  static async getTournaments(params: {
    academyId?: string;
    status?: string;
    userId: string;
    page?: number;
    limit?: number;
  }) {
    const { academyId, status, userId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const conditions = ["1=1"];
    const queryParams: any[] = [];

    if (status) {
      queryParams.push(status);
      conditions.push(`t.status = $${queryParams.length}`);
    }
    if (academyId) {
      queryParams.push(academyId);
      conditions.push(`t.academy_id = $${queryParams.length}`);
    }

    queryParams.push(userId);
    const userIdxParam = queryParams.length;
    queryParams.push(limit, offset);

    const result = await query(
      `SELECT t.*, a.name as academy_name,
        COUNT(DISTINCT tr.player_id) as registered_count,
        EXISTS (
          SELECT 1 FROM tournament_registrations ur
          WHERE ur.tournament_id = t.id AND ur.player_id = $${userIdxParam}
        ) as is_registered
       FROM tournaments t
       LEFT JOIN academies a ON t.academy_id = a.id
       LEFT JOIN tournament_registrations tr ON tr.tournament_id = t.id
       WHERE ${conditions.join(" AND ")}
       GROUP BY t.id, a.name
       ORDER BY t.starts_at ASC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams,
    );

    return result.rows;
  }

  static async getTournamentById(id: string) {
    const [tResult, regResult] = await Promise.all([
      query(
        `SELECT t.*, a.name as academy_name, u.name as organizer_name,
          COUNT(DISTINCT tr.player_id) as registered_count
         FROM tournaments t
         LEFT JOIN academies a ON t.academy_id = a.id
         LEFT JOIN users u ON t.organizer_id = u.id
         LEFT JOIN tournament_registrations tr ON tr.tournament_id = t.id
         WHERE t.id = $1
         GROUP BY t.id, a.name, u.name`,
        [id],
      ),
      query(
        `SELECT tr.player_id, tr.registered_at, u.name, u.rating, u.avatar
         FROM tournament_registrations tr
         JOIN users u ON tr.player_id = u.id
         WHERE tr.tournament_id = $1
         ORDER BY u.rating DESC`,
        [id],
      ),
    ]);

    if (!tResult.rows.length) return null;

    return {
      tournament: tResult.rows[0],
      players: regResult.rows,
    };
  }

  static async createTournament(data: any) {
    const {
      name,
      academyId,
      organizerId,
      format = "swiss",
      timeControl = "10+5",
      rounds = 5,
      maxPlayers = 64,
      startsAt,
      isPublic = true,
      description,
      prizePool = 0,
      entryFee = 0,
    } = data;

    const id = uuidv4();
    await query(
      `INSERT INTO tournaments (id, academy_id, organizer_id, name, description, format,
        time_control, rounds, max_players, is_public, starts_at, prize_pool, entry_fee, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'registration',NOW())`,
      [
        id,
        academyId,
        organizerId,
        name,
        description,
        format,
        timeControl,
        rounds,
        maxPlayers,
        isPublic,
        startsAt,
        prizePool,
        entryFee,
      ],
    );
    return id;
  }

  static async registerPlayer(tournamentId: string, userId: string) {
    const t = await this.getTournamentById(tournamentId);
    if (!t) throw new Error("Tournament not found");
    if (t.tournament.status !== "registration")
      throw new Error("Registration is closed");

    // Check if tournament is full
    if (
      t.tournament.max_players &&
      t.players.length >= t.tournament.max_players
    ) {
      throw new Error("Tournament is full");
    }

    if (t.players.some((p: any) => p.player_id === userId))
      throw new Error("Already registered");

    await transaction(async (client) => {
      await client.query(
        "INSERT INTO tournament_registrations (tournament_id, player_id, registered_at) VALUES ($1,$2,NOW())",
        [tournamentId, userId],
      );
      await client.query(
        "INSERT INTO tournament_standings (tournament_id, player_id, score, rank) VALUES ($1,$2,0,0)",
        [tournamentId, userId],
      );
    });
  }

  static async unregisterPlayer(tournamentId: string, userId: string) {
    const t = await query("SELECT status FROM tournaments WHERE id=$1", [
      tournamentId,
    ]);
    if (!t.rows.length) throw new Error("Tournament not found");
    if (t.rows[0].status !== "registration")
      throw new Error("Cannot unregister after registration period");

    await transaction(async (client) => {
      await client.query(
        "DELETE FROM tournament_registrations WHERE tournament_id=$1 AND player_id=$2",
        [tournamentId, userId],
      );
      await client.query(
        "DELETE FROM tournament_standings WHERE tournament_id=$1 AND player_id=$2",
        [tournamentId, userId],
      );
    });
  }

  static async updateTournament(id: string, data: any) {
    const fields = [];
    const vals = [];
    const allowed = [
      "name",
      "description",
      "starts_at",
      "format",
      "time_control",
      "rounds",
      "max_players",
      "is_public",
      "prize_pool",
      "entry_fee",
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        vals.push(data[key]);
        fields.push(`${key} = $${vals.length}`);
      }
    }

    if (fields.length === 0) return;
    vals.push(id);
    await query(
      `UPDATE tournaments SET ${fields.join(", ")} WHERE id = $${vals.length}`,
      vals,
    );
  }

  static async startTournament(id: string, actorContext?: any) {
    const t = await this.getTournamentById(id);
    if (!t) throw new Error("Tournament not found");
    if (t.tournament.status !== "registration")
      throw new Error("Tournament already started or cancelled");
    if (t.players.length < 2)
      throw new Error("At least 2 players required to start");

    await transaction(async (client) => {
      await client.query("UPDATE tournaments SET status='live', current_round=1 WHERE id=$1", [
        id,
      ]);

      // Initialize standings rank if not already (registerPlayer already does but just in case)
      await client.query(
        "UPDATE tournament_standings SET score=0, wins=0, draws=0, losses=0, tiebreak1=0, rank=0 WHERE tournament_id=$1",
        [id],
      );

      // Generate Round 1 pairings
      let pairs: any[] = [];
      if (t.tournament.format === "swiss") {
        const players = t.players.map((p) => ({
          player_id: p.player_id,
          had_bye: false,
          whites_count: 0,
        }));
        pairs = this.generateSwissPairings(players, []);
      } else if (t.tournament.format === "round_robin") {
        pairs = this.generateRoundRobinPairings(
          t.players.map((p) => p.player_id),
          1,
          t.tournament.rounds,
        );
      } else if (t.tournament.format === "knockout") {
        pairs = this.generateKnockoutPairings(t.players, 1);
      }

      for (let i = 0; i < pairs.length; i++) {
        const p = pairs[i];
        await client.query(
          `INSERT INTO tournament_matches (id, tournament_id, round, board_number, white_id, black_id, is_bye, status)
           VALUES ($1,$2,1,$3,$4,$5,$6,'pending')`,
          [uuidv4(), id, i + 1, p.white_id, p.black_id, p.is_bye],
        );

        // Notify players
        if (!p.is_bye) {
          if (p.white_id) {
            await NotificationService.createNotification({
              userId: p.white_id,
              type: 'tournament',
              title: `New Match: ${t.tournament.name}`,
              body: `You are paired as White for Round 1.`,
            }).catch(() => {});
          }
          if (p.black_id) {
            await NotificationService.createNotification({
              userId: p.black_id,
              type: 'tournament',
              title: `New Match: ${t.tournament.name}`,
              body: `You are paired as Black for Round 1.`,
            }).catch(() => {});
          }
        }
      }
    });

    if (actorContext) {
      await ActivityLogService.logActivity({
        actorId: actorContext.id,
        actorName: actorContext.name,
        actorRole: actorContext.role,
        academyId: actorContext.academyId,
        action: 'tournament_started',
        entityType: 'tournament',
        entityId: id,
        metadata: { playerCount: t.players.length, format: t.tournament.format },
      });
    }
  }

  static async updateMatchResult(
    tournamentId: string,
    matchId: string,
    result: string,
    actorContext?: any,
  ) {
    const match = await query(
      "SELECT * FROM tournament_matches WHERE id=$1 AND tournament_id=$2",
      [matchId, tournamentId],
    );
    if (!match.rows.length) throw new Error("Match not found");
    const m = match.rows[0];

    if (m.status === "completed") {
      // Rollback previous scores
      await this.rollbackMatchScores(m);
    }

    let whiteScore = 0;
    let blackScore = 0;

    if (result === 'white' || result === 'forfeit_black') {
      whiteScore = 1;
      blackScore = 0;
    } else if (result === 'black' || result === 'forfeit_white') {
      whiteScore = 0;
      blackScore = 1;
    } else if (result === 'draw') {
      whiteScore = 0.5;
      blackScore = 0.5;
    } else {
      throw new Error('Invalid result');
    }

    await transaction(async (client) => {
      await client.query(
        `UPDATE tournament_matches SET result=$1, white_score=$2, black_score=$3, status='completed', completed_at=NOW() WHERE id=$4`,
        [result, whiteScore, blackScore, matchId],
      );

      // Update standings
      if (m.white_id) {
        await client.query(
          `UPDATE tournament_standings SET score = COALESCE(score, 0) + $1,
            wins = COALESCE(wins, 0) + $2, draws = COALESCE(draws, 0) + $3, losses = COALESCE(losses, 0) + $4
           WHERE tournament_id=$5 AND player_id=$6`,
          [
            whiteScore,
            whiteScore === 1 ? 1 : 0,
            whiteScore === 0.5 ? 1 : 0,
            whiteScore === 0 ? 1 : 0,
            tournamentId,
            m.white_id,
          ],
        );
      }
      if (m.black_id && !m.is_bye) {
        await client.query(
          `UPDATE tournament_standings SET score = COALESCE(score, 0) + $1,
            wins = COALESCE(wins, 0) + $2, draws = COALESCE(draws, 0) + $3, losses = COALESCE(losses, 0) + $4
           WHERE tournament_id=$5 AND player_id=$6`,
          [
            blackScore,
            blackScore === 1 ? 1 : 0,
            blackScore === 0.5 ? 1 : 0,
            blackScore === 0 ? 1 : 0,
            tournamentId,
            m.black_id,
          ],
        );
      }
    });

    await this.recalcBuchholz(tournamentId);
    await this.rerank(tournamentId);

    if (actorContext) {
      await ActivityLogService.logActivity({
        actorId: actorContext.id,
        actorName: actorContext.name,
        actorRole: actorContext.role,
        academyId: actorContext.academyId,
        action: 'match_result_set',
        entityType: 'tournament_match',
        entityId: matchId,
        metadata: { tournamentId, result, whiteScore, blackScore },
      });
    }
  }

  static async generateNextRound(tournamentId: string, actorContext?: any) {
    const t = await this.getTournamentById(tournamentId);
    if (!t) throw new Error("Tournament not found");

    const matches = await query(
      "SELECT * FROM tournament_matches WHERE tournament_id=$1",
      [tournamentId],
    );
    const maxRound = Math.max(...matches.rows.map((m) => m.round), 0);
    const incomplete = matches.rows.filter(
      (m) => m.round === maxRound && m.status !== "completed",
    );

    if (incomplete.length > 0) throw new Error("Current round is not finished");
    if (maxRound >= t.tournament.rounds && t.tournament.format !== "knockout") {
      await query("UPDATE tournaments SET status='completed' WHERE id=$1", [
        tournamentId,
      ]);
      return { finished: true };
    }

    const nextRound = maxRound + 1;
    const standings = await this.getStandings(tournamentId);

    let pairs: any[] = [];
    if (t.tournament.format === "swiss") {
      const playerStats = await Promise.all(
        standings.map(async (s) => {
          const whites = matches.rows.filter(
            (m) => m.white_id === s.player_id,
          ).length;
          const hadBye = matches.rows.some(
            (m) => m.white_id === s.player_id && m.is_bye,
          );
          return {
            player_id: s.player_id,
            score: s.score,
            had_bye: hadBye,
            whites_count: whites,
          };
        }),
      );
      // Sort by score for Swiss
      playerStats.sort((a, b) => b.score - a.score);
      pairs = this.generateSwissPairings(playerStats, matches.rows);
    } else if (t.tournament.format === "round_robin") {
      pairs = this.generateRoundRobinPairings(
        standings.map((s) => s.player_id),
        nextRound,
        t.tournament.rounds,
      );
    } else if (t.tournament.format === "knockout") {
      // Only winners move up in knockout (score > 0 for that round)
      // Actually knockout usually handles by identifying winners of previous round
      const winners = matches.rows
        .filter((m) => m.round === maxRound)
        .map((m) => {
          if (m.white_score > m.black_score) return m.white_id;
          if (m.black_score > m.white_score) return m.black_id;
          return m.white_id; // Simple tiebreak for now
        });
      if (winners.length < 2) {
        await query("UPDATE tournaments SET status='completed' WHERE id=$1", [
          tournamentId,
        ]);
        return { finished: true };
      }
      pairs = this.generateKnockoutPairings(
        winners.map((id) => ({ player_id: id })),
        nextRound,
      );
    }

    await transaction(async (client) => {
      for (let i = 0; i < pairs.length; i++) {
        const p = pairs[i];
        await client.query(
          `INSERT INTO tournament_matches (id, tournament_id, round, board_number, white_id, black_id, is_bye, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')`,
          [
            uuidv4(),
            tournamentId,
            nextRound,
            i + 1,
            p.white_id,
            p.black_id,
            p.is_bye,
          ],
        );
      }
      
      await client.query("UPDATE tournaments SET current_round=$1 WHERE id=$2", [
        nextRound,
        tournamentId,
      ]);

      // Notify players
      for (const p of pairs) {
        if (!p.is_bye) {
          if (p.white_id) {
            await NotificationService.createNotification({
              userId: p.white_id,
              type: 'tournament',
              title: `New Match: Round ${nextRound}`,
              body: `Your next match is ready. You are playing as White.`,
            }).catch(() => {});
          }
          if (p.black_id) {
            await NotificationService.createNotification({
              userId: p.black_id,
              type: 'tournament',
              title: `New Match: Round ${nextRound}`,
              body: `Your next match is ready. You are playing as Black.`,
            }).catch(() => {});
          }
        }
      }
    });

    if (actorContext) {
      await ActivityLogService.logActivity({
        actorId: actorContext.id,
        actorName: actorContext.name,
        actorRole: actorContext.role,
        academyId: actorContext.academyId,
        action: 'tournament_next_round',
        entityType: 'tournament',
        entityId: tournamentId,
        metadata: { round: nextRound, pairsCount: pairs.length },
      });
    }

    return { finished: false, round: nextRound };
  }

  static async cancelTournament(id: string, actorContext?: any) {
    await query("UPDATE tournaments SET status='cancelled' WHERE id=$1", [id]);
    
    if (actorContext) {
      await ActivityLogService.logActivity({
        actorId: actorContext.id,
        actorName: actorContext.name,
        actorRole: actorContext.role,
        academyId: actorContext.academyId,
        action: 'tournament_cancelled',
        entityType: 'tournament',
        entityId: id,
      });
    }
  }

  static async getStandings(tournamentId: string) {
    const result = await query(
      `SELECT s.*, u.name, u.rating, u.avatar
       FROM tournament_standings s
       JOIN users u ON s.player_id = u.id
       WHERE s.tournament_id = $1
       ORDER BY s.score DESC, s.tiebreak1 DESC`,
      [tournamentId],
    );
    return result.rows;
  }

  static async getMatches(tournamentId: string, round?: number) {
    const conditions = ["tm.tournament_id = $1"];
    const params: any[] = [tournamentId];
    if (round) {
      params.push(round);
      conditions.push(`tm.round = $${params.length}`);
    }

    const result = await query(
      `SELECT
        tm.*,
        wu.name as white_name, wu.rating as white_rating, wu.avatar as white_avatar,
        bu.name as black_name, bu.rating as black_rating, bu.avatar as black_avatar,
        ws.score as white_total_score, bs.score as black_total_score
       FROM tournament_matches tm
       LEFT JOIN users wu ON tm.white_id = wu.id
       LEFT JOIN users bu ON tm.black_id = bu.id
       LEFT JOIN tournament_standings ws ON ws.tournament_id = tm.tournament_id AND ws.player_id = tm.white_id
       LEFT JOIN tournament_standings bs ON bs.tournament_id = tm.tournament_id AND bs.player_id = tm.black_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY tm.round DESC, tm.board_number ASC`,
      params,
    );
    return result.rows;
  }
}

export default TournamentService;
