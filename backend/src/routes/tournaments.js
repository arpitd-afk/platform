// ============================================================
// tournaments.js
// ============================================================
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
router.use(authenticate);

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

    params.push(limit, offset);
    const result = await query(
      `SELECT t.*, a.name as academy_name,
        COUNT(tr.player_id) as registered_count
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to get tournaments' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, a.name as academy_name,
        COUNT(tr.player_id) as registered_count
       FROM tournaments t
       LEFT JOIN academies a ON t.academy_id = a.id
       LEFT JOIN tournament_registrations tr ON tr.tournament_id = t.id
       WHERE t.id = $1
       GROUP BY t.id, a.name`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Tournament not found' });
    res.json({ tournament: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get tournament' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!['academy_admin', 'coach', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, format = 'swiss', timeControl = '10+5', rounds = 5, maxPlayers = 64,
      startsAt, isPublic = true, description, prizePool = 0, entryFee = 0 } = req.body;

    const id = uuidv4();
    await query(
      `INSERT INTO tournaments (id, academy_id, organizer_id, name, description, format,
        time_control, rounds, max_players, is_public, starts_at, prize_pool, entry_fee, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
      [id, req.user.academyId, req.user.id, name, description, format,
        timeControl, rounds, maxPlayers, isPublic, startsAt, prizePool, entryFee]
    );
    res.status(201).json({ message: 'Tournament created', id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create tournament' });
  }
});

router.post('/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      'INSERT INTO tournament_registrations (tournament_id, player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, req.user.id]
    );
    res.json({ message: 'Registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.get('/:id/standings', async (req, res) => {
  try {
    const result = await query(
      `SELECT ts.*, u.name, u.rating, u.avatar
       FROM tournament_standings ts
       JOIN users u ON ts.player_id = u.id
       WHERE ts.tournament_id = $1
       ORDER BY ts.score DESC, ts.tiebreak1 DESC`,
      [req.params.id]
    );
    res.json({ standings: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get standings' });
  }
});

module.exports = router;
