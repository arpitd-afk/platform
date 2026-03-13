const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('./activityLogs');

const router = express.Router();
router.use(authenticate);

// GET /api/anticheat/reports — list all cheat reports
router.get('/reports', authorize('super_admin', 'academy_admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`cr.status = $${params.length}`);
    }

    // Academy admins only see their academy's reports
    if (req.user.role === 'academy_admin') {
      params.push(req.user.academyId);
      conditions.push(`u.academy_id = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT cr.*, u.name as reported_name, u.rating as reported_rating, u.avatar as reported_avatar,
              g.white_player_id, g.black_player_id, g.time_control,
              reporter.name as reporter_name
       FROM cheat_reports cr
       LEFT JOIN users u ON cr.reported_user = u.id
       LEFT JOIN games g ON cr.game_id = g.id
       LEFT JOIN users reporter ON cr.reporter_id = reporter.id
       ${where}
       ORDER BY cr.created_at DESC LIMIT 100`,
      params
    );
    res.json({ reports: result.rows });
  } catch (e) {
    console.error('[anticheat]', e.message);
    res.status(500).json({ message: 'Failed to get reports' });
  }
});

// PUT /api/anticheat/reports/:id — review a cheat report
router.put('/reports/:id', authorize('super_admin', 'academy_admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['reviewed', 'confirmed', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use reviewed, confirmed, or dismissed.' });
    }

    const report = await query('SELECT * FROM cheat_reports WHERE id=$1', [req.params.id]);
    if (!report.rows.length) return res.status(404).json({ message: 'Report not found' });

    await query(
      `UPDATE cheat_reports SET status=$1, notes=$2 WHERE id=$3`,
      [status, notes || null, req.params.id]
    );

    // If confirmed, optionally deactivate the user
    if (status === 'confirmed') {
      await query(
        'UPDATE users SET is_active=false WHERE id=$1',
        [report.rows[0].reported_user]
      );
      logActivity({
        actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role,
        academyId: req.user.academyId, action: 'cheater_banned',
        entityType: 'user', entityId: report.rows[0].reported_user,
        metadata: { reportId: req.params.id, gameId: report.rows[0].game_id },
        ip: req.ip
      });
    }

    logActivity({
      actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role,
      academyId: req.user.academyId, action: `cheat_report_${status}`,
      entityType: 'cheat_report', entityId: req.params.id,
      metadata: { reportedUser: report.rows[0].reported_user, notes },
      ip: req.ip
    });

    res.json({ message: `Report ${status}` });
  } catch (e) {
    console.error('[anticheat]', e.message);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

// POST /api/anticheat/reports — manually create a cheat report
router.post('/reports', authorize('super_admin', 'academy_admin', 'coach'), async (req, res) => {
  try {
    const { gameId, reportedUserId, engineSimilarity, suspiciousMoves, notes } = req.body;
    if (!reportedUserId) return res.status(400).json({ message: 'reportedUserId is required' });

    const id = uuidv4();
    await query(
      `INSERT INTO cheat_reports (id, game_id, reported_user, reporter_id, engine_similarity, suspicious_moves, notes, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())`,
      [id, gameId || null, reportedUserId, req.user.id, engineSimilarity || null, suspiciousMoves || null, notes || null]
    );

    logActivity({
      actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role,
      academyId: req.user.academyId, action: 'cheat_report_created',
      entityType: 'cheat_report', entityId: id,
      metadata: { reportedUserId, gameId },
      ip: req.ip
    });

    res.status(201).json({ message: 'Cheat report filed', id });
  } catch (e) {
    console.error('[anticheat]', e.message);
    res.status(500).json({ message: 'Failed to create report' });
  }
});

// GET /api/anticheat/stats — overview stats for the anticheat dashboard
router.get('/stats', authorize('super_admin', 'academy_admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status='pending') as pending,
        COUNT(*) FILTER (WHERE status='reviewed') as reviewed,
        COUNT(*) FILTER (WHERE status='confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status='dismissed') as dismissed,
        COUNT(*) as total
      FROM cheat_reports
    `);
    res.json({ stats: result.rows[0] });
  } catch (e) {
    console.error('[anticheat]', e.message);
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

module.exports = router;
