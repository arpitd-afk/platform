import { prisma } from "../lib/prisma";
import logger from "../lib/logger";
import { NotificationService } from "./notificationService";
import { ActivityLogService } from "./activityLogService";
import { Prisma } from "@prisma/client";

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
  static async rollbackMatchScores(tx: any, m: any) {
    if (!m.white_id || m.is_bye) return;
    const ws = Number(m.white_score) || 0;
    const bs = Number(m.black_score) || 0;

    if (m.white_id) {
      await tx.$executeRaw`
        UPDATE tournament_standings SET score = GREATEST(COALESCE(score, 0) - ${ws}, 0),
          wins = GREATEST(COALESCE(wins, 0) - ${ws === 1 ? 1 : 0}, 0), 
          draws = GREATEST(COALESCE(draws, 0) - ${ws === 0.5 ? 1 : 0}, 0), 
          losses = GREATEST(COALESCE(losses, 0) - ${ws === 0 ? 1 : 0}, 0)
        WHERE tournament_id = ${m.tournament_id}::uuid AND player_id = ${m.white_id}::uuid
      `;
    }
    if (m.black_id) {
      await tx.$executeRaw`
        UPDATE tournament_standings SET score = GREATEST(COALESCE(score, 0) - ${bs}, 0),
          wins = GREATEST(COALESCE(wins, 0) - ${bs === 1 ? 1 : 0}, 0), 
          draws = GREATEST(COALESCE(draws, 0) - ${bs === 0.5 ? 1 : 0}, 0), 
          losses = GREATEST(COALESCE(losses, 0) - ${bs === 0 ? 1 : 0}, 0)
        WHERE tournament_id = ${m.tournament_id}::uuid AND player_id = ${m.black_id}::uuid
      `;
    }
  }

  /**
   * Recalculate Buchholz tiebreak
   */
  static async recalcBuchholz(tournamentId: string) {
    const matches = await prisma.tournamentMatch.findMany({
      where: {
        tournament_id: tournamentId,
        is_bye: false,
        status: "completed",
      },
      select: { white_id: true, black_id: true },
    });

    const standings = await prisma.tournamentStanding.findMany({
      where: { tournament_id: tournamentId },
      select: { player_id: true, score: true },
    });

    const scoreMap: Record<string, number> = {};
    for (const s of standings) scoreMap[s.player_id] = Number(s.score);

    const buchholz: Record<string, number> = {};
    for (const m of matches) {
      if (m.white_id && m.black_id) {
        buchholz[m.white_id] =
          (buchholz[m.white_id] || 0) + (scoreMap[m.black_id] || 0);
        buchholz[m.black_id] =
          (buchholz[m.black_id] || 0) + (scoreMap[m.white_id] || 0);
      }
    }

    await prisma.$transaction(
      Object.entries(buchholz).map(([pid, buch]) =>
        prisma.tournamentStanding.update({
          where: {
            tournament_id_player_id: {
              tournament_id: tournamentId,
              player_id: pid,
            },
          },
          data: { tiebreak1: buch },
        }),
      ),
    );
  }

  /**
   * Re-rank tournament standings
   */
  static async rerank(tournamentId: string) {
    const standings = await prisma.tournamentStanding.findMany({
      where: { tournament_id: tournamentId },
      orderBy: [{ score: "desc" }, { tiebreak1: "desc" }],
      select: { player_id: true },
    });

    await prisma.$transaction(
      standings.map((s, i) =>
        prisma.tournamentStanding.update({
          where: {
            tournament_id_player_id: {
              tournament_id: tournamentId,
              player_id: s.player_id,
            },
          },
          data: { rank: i + 1 },
        }),
      ),
    );
  }

  static async getTournaments(params: {
    academyId?: string;
    status?: string;
    userId: string;
    page?: number;
    limit?: number;
  }) {
    const { academyId, status, userId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (academyId) where.academy_id = academyId;

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        academy: { select: { name: true } },
        _count: { select: { registrations: true } },
        registrations: {
          where: { player_id: userId },
          select: { player_id: true },
          take: 1,
        },
      },
      orderBy: { starts_at: "asc" },
      take: limit,
      skip,
    });

    return tournaments.map((t) => ({
      ...t,
      academy_name: t.academy?.name,
      registered_count: t._count.registrations,
      is_registered: t.registrations.length > 0,
    }));
  }

  static async getTournamentById(id: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        academy: { select: { name: true } },
        organizer: { select: { name: true } },
        _count: { select: { registrations: true } },
        registrations: {
          include: {
            player: {
              select: { id: true, name: true, rating: true, avatar: true },
            },
          },
          orderBy: { player: { rating: "desc" } },
        },
      },
    });

    if (!tournament) return null;

    return {
      tournament: {
        ...tournament,
        academy_name: tournament.academy?.name,
        organizer_name: tournament.organizer?.name,
        registered_count: tournament._count.registrations,
      },
      players: tournament.registrations.map((r) => ({
        ...r.player,
        player_id: r.player.id,
        registered_at: r.registered_at,
      })),
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

    const tournament = await prisma.tournament.create({
      data: {
        name,
        academy_id: academyId,
        organizer_id: organizerId,
        format,
        time_control: timeControl,
        rounds,
        max_players: maxPlayers,
        is_public: isPublic,
        starts_at: startsAt ? new Date(startsAt) : new Date(),
        prize_pool: prizePool,
        entry_fee: entryFee,
        status: "registration",
      },
    });
    return tournament.id;
  }

  static async registerPlayer(tournamentId: string, userId: string) {
    const t = await this.getTournamentById(tournamentId);
    if (!t) throw new Error("Tournament not found");
    if (t.tournament.status !== "registration")
      throw new Error("Registration is closed");

    if (
      t.tournament.max_players &&
      t.players.length >= t.tournament.max_players
    ) {
      throw new Error("Tournament is full");
    }

    const alreadyRegistered = await prisma.tournamentRegistration.findUnique({
      where: {
        tournament_id_player_id: {
          tournament_id: tournamentId,
          player_id: userId,
        },
      },
    });
    if (alreadyRegistered) throw new Error("Already registered");

    await prisma.$transaction([
      prisma.tournamentRegistration.create({
        data: { tournament_id: tournamentId, player_id: userId },
      }),
      prisma.tournamentStanding.create({
        data: {
          tournament_id: tournamentId,
          player_id: userId,
          score: 0,
          rank: 0,
        },
      }),
    ]);
  }

  static async unregisterPlayer(tournamentId: string, userId: string) {
    const t = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true },
    });
    if (!t) throw new Error("Tournament not found");
    if (t.status !== "registration")
      throw new Error("Cannot unregister after registration period");

    await prisma.$transaction([
      prisma.tournamentRegistration.delete({
        where: {
          tournament_id_player_id: {
            tournament_id: tournamentId,
            player_id: userId,
          },
        },
      }),
      prisma.tournamentStanding.delete({
        where: {
          tournament_id_player_id: {
            tournament_id: tournamentId,
            player_id: userId,
          },
        },
      }),
    ]);
  }

  static async updateTournament(id: string, data: any) {
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

    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updateData[key] =
          key === "starts_at" && data[key] ? new Date(data[key]) : data[key];
      }
    }

    if (Object.keys(updateData).length === 0) return;

    await prisma.tournament.update({
      where: { id },
      data: updateData,
    });
  }

  static async startTournament(id: string, actorContext?: any) {
    const t = await this.getTournamentById(id);
    if (!t) throw new Error("Tournament not found");
    if (t.tournament.status !== "registration")
      throw new Error("Tournament already started or cancelled");
    if (t.players.length < 2)
      throw new Error("At least 2 players required to start");

    await prisma.$transaction(async (tx) => {
      await tx.tournament.update({
        where: { id },
        data: { status: "live", current_round: 1 },
      });

      await tx.tournamentStanding.updateMany({
        where: { tournament_id: id },
        data: { score: 0, wins: 0, draws: 0, losses: 0, tiebreak1: 0, rank: 0 },
      });

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
          t.tournament.rounds || 5,
        );
      } else if (t.tournament.format === "knockout") {
        pairs = this.generateKnockoutPairings(t.players, 1);
      }

      for (let i = 0; i < pairs.length; i++) {
        const p = pairs[i];
        await tx.tournamentMatch.create({
          data: {
            tournament_id: id,
            round: 1,
            board_number: i + 1,
            white_id: p.white_id,
            black_id: p.black_id,
            is_bye: p.is_bye,
            status: "pending",
          },
        });

        // Notify players
        if (!p.is_bye) {
          if (p.white_id) {
            await NotificationService.createNotification({
              userId: p.white_id,
              type: "tournament",
              title: `New Match: ${t.tournament.name}`,
              body: `You are paired as White for Round 1.`,
            }).catch(() => {});
          }
          if (p.black_id) {
            await NotificationService.createNotification({
              userId: p.black_id,
              type: "tournament",
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
        action: "tournament_started",
        entityType: "tournament",
        entityId: id,
        metadata: {
          playerCount: t.players.length,
          format: t.tournament.format,
        },
      });
    }
  }

  static async updateMatchResult(
    tournamentId: string,
    matchId: string,
    result: string,
    actorContext?: any,
  ) {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
    });
    if (!match || match.tournament_id !== tournamentId)
      throw new Error("Match not found");

    let whiteScore = 0;
    let blackScore = 0;

    await prisma.$transaction(async (tx) => {
      if (match.status === "completed") {
        await this.rollbackMatchScores(tx, match);
      }

      if (result === "white" || result === "forfeit_black") {
        whiteScore = 1;
        blackScore = 0;
      } else if (result === "black" || result === "forfeit_white") {
        whiteScore = 0;
        blackScore = 1;
      } else if (result === "draw") {
        whiteScore = 0.5;
        blackScore = 0.5;
      } else {
        throw new Error("Invalid result");
      }

      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: {
          result,
          white_score: whiteScore,
          black_score: blackScore,
          status: "completed",
          completed_at: new Date(),
        },
      });

      // Update standings
      if (match.white_id) {
        await tx.$executeRaw`
          UPDATE tournament_standings SET score = COALESCE(score, 0) + ${whiteScore},
            wins = COALESCE(wins, 0) + ${whiteScore === 1 ? 1 : 0}, 
            draws = COALESCE(draws, 0) + ${whiteScore === 0.5 ? 1 : 0}, 
            losses = COALESCE(losses, 0) + ${whiteScore === 0 ? 1 : 0}
          WHERE tournament_id = ${tournamentId}::uuid AND player_id = ${match.white_id}::uuid
        `;
      }
      if (match.black_id && !match.is_bye) {
        await tx.$executeRaw`
          UPDATE tournament_standings SET score = COALESCE(score, 0) + ${blackScore},
            wins = COALESCE(wins, 0) + ${blackScore === 1 ? 1 : 0}, 
            draws = COALESCE(draws, 0) + ${blackScore === 0.5 ? 1 : 0}, 
            losses = COALESCE(losses, 0) + ${blackScore === 0 ? 1 : 0}
          WHERE tournament_id = ${tournamentId}::uuid AND player_id = ${match.black_id}::uuid
        `;
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
        action: "match_result_set",
        entityType: "tournament_match",
        entityId: matchId,
        metadata: { tournamentId, result, whiteScore, blackScore },
      });
    }
  }

  static async generateNextRound(tournamentId: string, actorContext?: any) {
    const t = await this.getTournamentById(tournamentId);
    if (!t) throw new Error("Tournament not found");

    const matches = await prisma.tournamentMatch.findMany({
      where: { tournament_id: tournamentId },
    });

    const maxRound = Math.max(...matches.map((m) => m.round), 0);
    const incomplete = matches.filter(
      (m) => m.round === maxRound && m.status !== "completed",
    );

    if (incomplete.length > 0) throw new Error("Current round is not finished");
    if (
      maxRound >= (t.tournament.rounds || 0) &&
      t.tournament.format !== "knockout"
    ) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "completed" },
      });
      return { finished: true };
    }

    const nextRound = maxRound + 1;
    const standings = await this.getStandings(tournamentId);

    let pairs: any[] = [];
    if (t.tournament.format === "swiss") {
      const playerStats = standings.map((s) => {
        const whites = matches.filter((m) => m.white_id === s.player_id).length;
        const hadBye = matches.some(
          (m) => m.white_id === s.player_id && m.is_bye,
        );
        return {
          player_id: s.player_id,
          score: Number(s.score),
          had_bye: hadBye,
          whites_count: whites,
        };
      });
      playerStats.sort((a, b) => b.score - a.score);
      pairs = this.generateSwissPairings(playerStats, matches);
    } else if (t.tournament.format === "round_robin") {
      pairs = this.generateRoundRobinPairings(
        standings.map((s) => s.player_id),
        nextRound,
        t.tournament.rounds || 1,
      );
    } else if (t.tournament.format === "knockout") {
      const winners = matches
        .filter((m) => m.round === maxRound)
        .map((m) => {
          if (Number(m.white_score) > Number(m.black_score)) return m.white_id;
          if (Number(m.black_score) > Number(m.white_score)) return m.black_id;
          return m.white_id;
        });
      if (winners.length < 2) {
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: "completed" },
        });
        return { finished: true };
      }
      pairs = this.generateKnockoutPairings(
        winners.map((id) => ({ player_id: id })),
        nextRound,
      );
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < pairs.length; i++) {
        const p = pairs[i];
        await tx.tournamentMatch.create({
          data: {
            tournament_id: tournamentId,
            round: nextRound,
            board_number: i + 1,
            white_id: p.white_id,
            black_id: p.black_id,
            is_bye: p.is_bye,
            status: "pending",
          },
        });
      }

      await tx.tournament.update({
        where: { id: tournamentId },
        data: { current_round: nextRound },
      });

      // Notify players
      for (const p of pairs) {
        if (!p.is_bye) {
          if (p.white_id) {
            await NotificationService.createNotification({
              userId: p.white_id,
              type: "tournament",
              title: `New Match: Round ${nextRound}`,
              body: `Your next match is ready. You are playing as White.`,
            }).catch(() => {});
          }
          if (p.black_id) {
            await NotificationService.createNotification({
              userId: p.black_id,
              type: "tournament",
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
        action: "tournament_next_round",
        entityType: "tournament",
        entityId: tournamentId,
        metadata: { round: nextRound, pairsCount: pairs.length },
      });
    }

    return { finished: false, round: nextRound };
  }

  static async cancelTournament(id: string, actorContext?: any) {
    await prisma.tournament.update({
      where: { id },
      data: { status: "cancelled" },
    });

    if (actorContext) {
      await ActivityLogService.logActivity({
        actorId: actorContext.id,
        actorName: actorContext.name,
        actorRole: actorContext.role,
        academyId: actorContext.academyId,
        action: "tournament_cancelled",
        entityType: "tournament",
        entityId: id,
      });
    }
  }

  static async getStandings(tournamentId: string) {
    const standings = await prisma.tournamentStanding.findMany({
      where: { tournament_id: tournamentId },
      include: {
        player: { select: { name: true, rating: true, avatar: true } },
      },
      orderBy: [{ score: "desc" }, { tiebreak1: "desc" }],
    });

    return standings.map((s) => ({
      ...s,
      name: s.player.name,
      rating: s.player.rating,
      avatar: s.player.avatar,
    }));
  }

  static async getMatches(tournamentId: string, round?: number) {
    const where: any = { tournament_id: tournamentId };
    if (round) where.round = round;

    const matches = await prisma.tournamentMatch.findMany({
      where,
      orderBy: [{ round: "desc" }, { board_number: "asc" }],
    });

    // Fetch related data in separate step for better control/types
    const playerIds = Array.from(
      new Set(matches.flatMap((m) => [m.white_id, m.black_id]).filter(Boolean)),
    ) as string[];
    const [players, standings] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, name: true, rating: true, avatar: true },
      }),
      prisma.tournamentStanding.findMany({
        where: { tournament_id: tournamentId, player_id: { in: playerIds } },
        select: { player_id: true, score: true },
      }),
    ]);

    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
    const scoreMap = Object.fromEntries(
      standings.map((s) => [s.player_id, s.score]),
    );

    return matches.map((m) => ({
      ...m,
      white_name: m.white_id ? playerMap[m.white_id]?.name : null,
      white_rating: m.white_id ? playerMap[m.white_id]?.rating : null,
      white_avatar: m.white_id ? playerMap[m.white_id]?.avatar : null,
      black_name: m.black_id ? playerMap[m.black_id]?.name : null,
      black_rating: m.black_id ? playerMap[m.black_id]?.rating : null,
      black_avatar: m.black_id ? playerMap[m.black_id]?.avatar : null,
      white_total_score: m.white_id ? scoreMap[m.white_id] : null,
      black_total_score: m.black_id ? scoreMap[m.black_id] : null,
    }));
  }
}

export default TournamentService;
