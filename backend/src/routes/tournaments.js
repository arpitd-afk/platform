const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const TournamentService = require('../services/TournamentService');
const { logActivity } = require('./activityLogs');

const router = express.Router();
router.use(authenticate);

// ─── GET / — List tournaments ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, academyId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = ['1=1'];
    const params = [];

    if (status) { params.push(status); conditions.push(`t.status = $${params.length}`); }
    if (academyId) { params.push(academyId); conditions.push(`t.academy_id = $${params.length}`); }
    else if (req.user.role !== 'super_admin') {
      params.push(req.user.academyId);
      conditions.push(`(t.academy_id = $${params.length} OR t.is_public = true)`);
    }

    // Add current user id for is_registered subquery
    params.push(req.user.id);
    const userIdxParam = params.length;
    params.push(limit, offset);
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
       WHERE ${conditions.join(' AND ')}
       GROUP BY t.id, a.name
       ORDER BY t.starts_at ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ tournaments: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get tournaments' });
  }
});

// ─── GET /:id — Get tournament details ───────────────────────
router.get('/:id', async (req, res) => {
  try {
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
        [req.params.id]
      ),
      query(
        `SELECT tr.player_id, tr.registered_at, u.name, u.rating, u.avatar
         FROM tournament_registrations tr
         JOIN users u ON tr.player_id = u.id
         WHERE tr.tournament_id = $1
         ORDER BY u.rating DESC`,
        [req.params.id]
      )
    ]);

    if (!tResult.rows.length) return res.status(404).json({ message: 'Tournament not found' });

    res.json({
      tournament: tResult.rows[0],
      players: regResult.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get tournament' });
  }
});

// ─── POST / — Create tournament ──────────────────────────────
router.post('/', authorize('academy_admin', 'coach', 'super_admin'), async (req, res) => {
  try {
    const { name, format = 'swiss', timeControl = '10+5', rounds = 5, maxPlayers = 64,
      startsAt, isPublic = true, description, prizePool = 0, entryFee = 0 } = req.body;
    if (!name) return res.status(400).json({ message: 'Tournament name required' });

    const id = uuidv4();
    await query(
      `INSERT INTO tournaments (id, academy_id, organizer_id, name, description, format,
        time_control, rounds, max_players, is_public, starts_at, prize_pool, entry_fee, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'registration',NOW())`,
      [id, req.user.academyId, req.user.id, name, description, format,
        timeControl, rounds, maxPlayers, isPublic, startsAt, prizePool, entryFee]
    );
    res.status(201).json({ message: 'Tournament created', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create tournament' });
  }
});

// ─── PUT /:id — Update tournament ────────────────────────────
router.put('/:id', authorize('academy_admin', 'coach', 'super_admin'), async (req, res) => {
  try {
    const { name, description, status, timeControl, rounds, maxPlayers, startsAt, prizePool, entryFee } = req.body;
    await query(
      `UPDATE tournaments SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        time_control = COALESCE($4, time_control),
        rounds = COALESCE($5, rounds),
        max_players = COALESCE($6, max_players),
        starts_at = COALESCE($7, starts_at),
        prize_pool = COALESCE($8, prize_pool),
        entry_fee = COALESCE($9, entry_fee)
       WHERE id = $10`,
      [name, description, status, timeControl, rounds, maxPlayers, startsAt, prizePool, entryFee, req.params.id]
    );
    res.json({ message: 'Tournament updated' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update tournament' });
  }
});

// ─── POST /:id/register — Register player ────────────────────
router.post('/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const t = await query('SELECT status, max_players FROM tournaments WHERE id=$1', [id]);
    if (!t.rows.length) return res.status(404).json({ message: 'Tournament not found' });
    if (!['registration', 'upcoming'].includes(t.rows[0].status)) {
      return res.status(400).json({ message: 'Registration is closed' });
    }
    const count = await query('SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id=$1', [id]);
    if (parseInt(count.rows[0].count) >= t.rows[0].max_players) {
      return res.status(400).json({ message: 'Tournament is full' });
    }
    await query(
      'INSERT INTO tournament_registrations (tournament_id, player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, req.user.id]
    );
    res.json({ message: 'Registered successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

// ─── POST /:id/unregister — Withdraw ─────────────────────────
router.post('/:id/unregister', async (req, res) => {
  try {
    await query(
      'DELETE FROM tournament_registrations WHERE tournament_id=$1 AND player_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Unregistered' });
  } catch (e) {
    res.status(500).json({ message: 'Failed', _route: 'tournaments' });
  }
});

// ─── POST /:id/start — Start tournament + generate round 1 ──
router.post('/:id/start', authorize('academy_admin', 'coach', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const [tRes, playersRes] = await Promise.all([
      query('SELECT * FROM tournaments WHERE id=$1', [id]),
      query(
        `SELECT tr.player_id, u.rating, u.name
         FROM tournament_registrations tr
         JOIN users u ON tr.player_id = u.id
         WHERE tr.tournament_id = $1
         ORDER BY u.rating DESC`,
        [id]
      )
    ]);

    if (!tRes.rows.length) return res.status(404).json({ message: 'Tournament not found' });
    const t = tRes.rows[0];
    if (t.status === 'live') return res.status(400).json({ message: 'Tournament already started' });
    if (playersRes.rows.length < 2) return res.status(400).json({ message: 'Need at least 2 players to start' });

    const players = playersRes.rows.map((p, i) => ({
      ...p,
      score: 0, whites_count: 0, had_bye: false,
    }));

    // Initialize standings for all players
    await query('DELETE FROM tournament_standings WHERE tournament_id=$1', [id]);
    for (const p of players) {
      await query(
        `INSERT INTO tournament_standings (tournament_id, player_id, rank, score, tiebreak1, tiebreak2, wins, draws, losses)
         VALUES ($1,$2,$3,0,0,0,0,0,0)`,
        [id, p.player_id, players.indexOf(p) + 1]
      );
    }

    // Generate round 1 pairings based on format
    let pairs = [];
    if (t.format === 'swiss') {
      pairs = TournamentService.generateSwissPairings(players, []);
    } else if (t.format === 'round_robin') {
      pairs = TournamentService.generateRoundRobinPairings(players.map(p => p.player_id), 1, t.rounds);
    } else if (t.format === 'knockout') {
      pairs = TournamentService.generateKnockoutPairings(players, 1);
    } else {
      pairs = TournamentService.generateSwissPairings(players, []); // arena fallback
    }

    // Insert matches
    let boardNum = 1;
    for (const pair of pairs) {
      await query(
        `INSERT INTO tournament_matches (id, tournament_id, round, board_number, white_id, black_id, is_bye, status, created_at)
         VALUES ($1,$2,1,$3,$4,$5,$6,'pending',NOW())`,
        [uuidv4(), id, boardNum++, pair.white_id, pair.black_id, pair.is_bye]
      );
      // Auto-score byes
      if (pair.is_bye) {
        await query(
          `UPDATE tournament_standings SET score = score + 1, wins = wins + 1
           WHERE tournament_id=$1 AND player_id=$2`,
          [id, pair.white_id]
        );
      } else {
        // Pairing notification for white player
        if (pair.white_id) {
          await query(
            'INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, \'tournament\', $2, $3, NOW())',
            [pair.white_id, `New Match: ${t.name}`, `You are paired as White for Round 1 against ${pair.black_name || 'Opponent'}.`]
          ).catch(() => {});
        }
        // Pairing notification for black player
        if (pair.black_id) {
          await query(
            'INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, \'tournament\', $2, $3, NOW())',
            [pair.black_id, `New Match: ${t.name}`, `You are paired as Black for Round 1 against ${pair.white_name || 'Opponent'}.`]
          ).catch(() => {});
        }
      }
    }

    // Update tournament status
    await query(
      `UPDATE tournaments SET status='live', current_round=1 WHERE id=$1`,
      [id]
    );

    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId: req.user.academyId, action: 'tournament_started', entityType: 'tournament', entityId: id, metadata: { playerCount: players.length, format: t.format }, ip: req.ip });

    res.json({ message: 'Tournament started! Round 1 pairings generated.', pairs: pairs.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to start tournament' });
  }
});

// ─── GET /:id/pairings — Get all rounds pairings ─────────────
router.get('/:id/pairings', async (req, res) => {
  try {
    const { round } = req.query;
    const conditions = ['tm.tournament_id = $1'];
    const params = [req.params.id];
    if (round) { params.push(round); conditions.push(`tm.round = $${params.length}`); }

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
       WHERE ${conditions.join(' AND ')}
       ORDER BY tm.round ASC, tm.board_number ASC`,
      params
    );

    // Group by round
    const byRound = {};
    for (const m of result.rows) {
      if (!byRound[m.round]) byRound[m.round] = [];
      byRound[m.round].push(m);
    }

    res.json({ pairings: result.rows, byRound });
  } catch (e) {
    console.error('[pairings-fetch]', e);
    res.status(500).json({ message: 'Failed to get pairings' });
  }
});

// ─── PUT /:id/matches/:matchId/result — Submit match result ─
router.put('/:id/matches/:matchId/result', authorize('academy_admin', 'coach', 'super_admin'), async (req, res) => {
  try {
    const { matchId } = req.params;
    const { result } = req.body; // 'white' | 'black' | 'draw' | 'forfeit_white' | 'forfeit_black'

    if (!['white', 'black', 'draw', 'forfeit_white', 'forfeit_black'].includes(result)) {
      return res.status(400).json({ message: 'Invalid result. Use: white, black, draw, forfeit_white, forfeit_black' });
    }

    const match = await query(
      'SELECT * FROM tournament_matches WHERE id=$1 AND tournament_id=$2',
      [matchId, req.params.id]
    );
    if (!match.rows.length) return res.status(404).json({ message: 'Match not found' });
    const m = match.rows[0];

    if (m.status === 'completed') {
      // Rollback previous scores before updating
      await TournamentService.rollbackMatchScores(m);
    }

    // Determine scores
    let whiteScore = 0, blackScore = 0;
    if (result === 'white' || result === 'forfeit_black') { whiteScore = 1; blackScore = 0; }
    else if (result === 'black' || result === 'forfeit_white') { whiteScore = 0; blackScore = 1; }
    else if (result === 'draw') { whiteScore = 0.5; blackScore = 0.5; }

    // Update match record
    await query(
      `UPDATE tournament_matches SET result=$1, status='completed', completed_at=NOW(),
        white_score=$2, black_score=$3 WHERE id=$4`,
      [result, whiteScore, blackScore, matchId]
    );

    // Update standings
    if (m.white_id && !m.is_bye) {
      const wWins = whiteScore === 1 ? 1 : 0;
      const wDraws = whiteScore === 0.5 ? 1 : 0;
      const wLoss = whiteScore === 0 ? 1 : 0;
      await query(
        `UPDATE tournament_standings SET
          score = score + $1, wins = wins + $2, draws = draws + $3, losses = losses + $4
         WHERE tournament_id=$5 AND player_id=$6`,
        [whiteScore, wWins, wDraws, wLoss, req.params.id, m.white_id]
      );
    }
    if (m.black_id && !m.is_bye) {
      const bWins = blackScore === 1 ? 1 : 0;
      const bDraws = blackScore === 0.5 ? 1 : 0;
      const bLoss = blackScore === 0 ? 1 : 0;
      await query(
        `UPDATE tournament_standings SET
          score = score + $1, wins = wins + $2, draws = draws + $3, losses = losses + $4
         WHERE tournament_id=$5 AND player_id=$6`,
        [blackScore, bWins, bDraws, bLoss, req.params.id, m.black_id]
      );
    }

    // Recalculate Buchholz tiebreak
    await TournamentService.recalcBuchholz(req.params.id);

    // Re-rank standings
    await TournamentService.rerank(req.params.id);

    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId: req.user.academyId, action: 'match_result_set', entityType: 'tournament_match', entityId: matchId, metadata: { tournamentId: req.params.id, result, whiteScore, blackScore }, ip: req.ip });

    res.json({ message: 'Result recorded', whiteScore, blackScore });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to record result' });
  }
});

// ─── POST /:id/next-round — Generate next round pairings ────
router.post('/:id/next-round', authorize('academy_admin', 'coach', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const tRes = await query('SELECT * FROM tournaments WHERE id=$1', [id]);
    if (!tRes.rows.length) return res.status(404).json({ message: 'Tournament not found' });
    const t = tRes.rows[0];

    const [currentMatchesRes, standingsRes, allMatchesRes] = await Promise.all([
      query(
        `SELECT * FROM tournament_matches
         WHERE tournament_id=$1 AND round=$2`,
        [id, t.current_round]
      ),
      query(
        `SELECT ts.player_id, ts.score, ts.wins, ts.draws, ts.losses, u.rating,
          (SELECT COUNT(*) FROM tournament_matches tm2
           WHERE tm2.tournament_id=$1 AND tm2.white_id=ts.player_id) as whites_count,
          (SELECT COUNT(*) FROM tournament_matches tm3
           WHERE tm3.tournament_id=$1 AND (tm3.white_id=ts.player_id OR tm3.black_id=ts.player_id) AND tm3.is_bye=true) as had_bye_count
         FROM tournament_standings ts
         JOIN users u ON ts.player_id = u.id
         WHERE ts.tournament_id=$1
         ORDER BY ts.score DESC, ts.tiebreak1 DESC, u.rating DESC`,
        [id]
      ),
      query(
        `SELECT white_id, black_id FROM tournament_matches
         WHERE tournament_id=$1 AND is_bye=false AND status='completed'`,
        [id]
      )
    ]);

    // Check all current round matches are done
    const pending = currentMatchesRes.rows.filter(m => m.status !== 'completed');
    if (pending.length > 0) {
      return res.status(400).json({
        message: `${pending.length} match${pending.length > 1 ? 'es' : ''} still pending in current round`,
        pending: pending.length
      });
    }

    const nextRound = t.current_round + 1;
    if (nextRound > t.rounds) {
      // End tournament
      await query(`UPDATE tournaments SET status='completed', ends_at=NOW() WHERE id=$1`, [id]);
      return res.json({ message: 'Tournament completed! All rounds finished.', completed: true });
    }

    // Generate new pairings
    const players = standingsRes.rows.map(p => ({
      ...p,
      had_bye: parseInt(p.had_bye_count) > 0,
      whites_count: parseInt(p.whites_count),
    }));

    let pairs = [];
    if (t.format === 'swiss') {
      pairs = TournamentService.generateSwissPairings(players, allMatchesRes.rows);
    } else if (t.format === 'round_robin') {
      pairs = TournamentService.generateRoundRobinPairings(players.map(p => p.player_id), nextRound, t.rounds);
    } else if (t.format === 'knockout') {
      // Only winners advance
      const winners = currentMatchesRes.rows
        .filter(m => !m.is_bye)
        .map(m => m.result === 'white' ? m.white_id : m.result === 'black' ? m.black_id : m.white_id); // draw: white advances
      const byePlayers = currentMatchesRes.rows.filter(m => m.is_bye).map(m => m.white_id);
      const advancers = [...winners, ...byePlayers].map(pid => players.find(p => p.player_id === pid)).filter(Boolean);
      pairs = TournamentService.generateKnockoutPairings(advancers, nextRound);
    } else {
      // Arena or other formats: use Swiss as fallback for discrete round generation
      pairs = TournamentService.generateSwissPairings(players, allMatchesRes.rows);
    }

    if (pairs.length === 0) {
      return res.status(400).json({ message: 'Could not generate any pairings. Check players list.' });
    }

    // Insert new matches
    let boardNum = 1;
    for (const pair of pairs) {
      await query(
        `INSERT INTO tournament_matches (id, tournament_id, round, board_number, white_id, black_id, is_bye, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',NOW())`,
        [uuidv4(), id, nextRound, boardNum++, pair.white_id, pair.black_id, pair.is_bye]
      );
      if (pair.is_bye) {
        await query(
          `UPDATE tournament_standings SET score = score + 1, wins = wins + 1
           WHERE tournament_id=$1 AND player_id=$2`,
          [id, pair.white_id]
        );
      } else {
        // Pairing notification
        if (pair.white_id) {
          await query(
            'INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, \'tournament\', $2, $3, NOW())',
            [pair.white_id, `New Match: ${t.name}`, `Round ${nextRound} pairing is ready. You are playing as White.`]
          ).catch(() => {});
        }
        if (pair.black_id) {
          await query(
            'INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, \'tournament\', $2, $3, NOW())',
            [pair.black_id, `New Match: ${t.name}`, `Round ${nextRound} pairing is ready. You are playing as Black.`]
          ).catch(() => {});
        }
      }
    }

    console.log(`[Tournament] Generated ${pairs.length} pairings for Round ${nextRound} in Tournament ${id}`);

    await query(`UPDATE tournaments SET current_round=$1 WHERE id=$2`, [nextRound, id]);

    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId: req.user.academyId, action: 'tournament_next_round', entityType: 'tournament', entityId: id, metadata: { round: nextRound, pairsCount: pairs.length }, ip: req.ip });

    res.json({
      message: `Round ${nextRound} pairings generated!`,
      round: nextRound,
      pairsCount: pairs.length,
      pairings: pairs
    });
  } catch (e) {
    console.error('[next-round-error]', e);
    res.status(500).json({ message: 'Failed to generate next round' });
  }
});

// ─── GET /:id/standings ─────────────────────────────────────
router.get('/:id/standings', async (req, res) => {
  try {
    const result = await query(
      `SELECT ts.*, u.name, u.rating, u.avatar
       FROM tournament_standings ts
       JOIN users u ON ts.player_id = u.id
       WHERE ts.tournament_id = $1
       ORDER BY ts.score DESC, ts.tiebreak1 DESC, u.rating DESC`,
      [req.params.id]
    );
    res.json({ standings: result.rows });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get standings' });
  }
});

// ─── POST /:id/cancel — Cancel tournament ────────────────────
router.post('/:id/cancel', authorize('academy_admin', 'coach', 'super_admin'), async (req, res) => {
  try {
    await query(`UPDATE tournaments SET status='cancelled' WHERE id=$1`, [req.params.id]);
    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId: req.user.academyId, action: 'tournament_cancelled', entityType: 'tournament', entityId: req.params.id, ip: req.ip });
    res.json({ message: 'Tournament cancelled' });
  } catch (e) {
    res.status(500).json({ message: 'Failed', _route: 'tournaments' });
  }
});

module.exports = router;