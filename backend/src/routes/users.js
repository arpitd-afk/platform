const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { usersRouter } = require('./_combined');
const router = usersRouter;

// Additional routes not in _combined

// GET /api/users/:id/rating-history
router.get('/:id/rating-history', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const result = await query(
      'SELECT rating, recorded_at as date FROM rating_history WHERE user_id=$1 ORDER BY recorded_at ASC LIMIT $2',
      [req.params.id, limit]
    );
    res.json({ history: result.rows });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// PUT /api/users/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    if (!['super_admin', 'academy_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { active } = req.body;
    await query('UPDATE users SET is_active=$1, updated_at=NOW() WHERE id=$2', [active, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/users/my-children  (parent)
router.get('/my-children', async (req, res) => {
  try {
    if (req.user.role !== 'parent') return res.status(403).json({ message: 'Not authorized' });
    const result = await query(
      `SELECT u.id, u.name, u.email, u.rating, u.avatar,
        b.name as batch_name, c.name as coach_name, a.name as academy_name
       FROM parent_student ps
       JOIN users u ON ps.student_id = u.id
       LEFT JOIN batch_enrollments be ON be.student_id = u.id
       LEFT JOIN batches b ON be.batch_id = b.id
       LEFT JOIN users c ON b.coach_id = c.id
       LEFT JOIN academies a ON u.academy_id = a.id
       WHERE ps.parent_id = $1`,
      [req.user.id]
    );
    res.json({ children: result.rows });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/users/:id/attendance
router.get('/:id/attendance', async (req, res) => {
  try {
    const result = await query(
      `SELECT ca.*, cl.title as class_title, cl.scheduled_at
       FROM classroom_attendance ca
       JOIN classrooms cl ON ca.classroom_id = cl.id
       WHERE ca.student_id = $1
       ORDER BY cl.scheduled_at DESC LIMIT 50`,
      [req.params.id]
    );
    res.json({ attendance: result.rows });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/users/:id/games
router.get('/:id/games', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await query(
      `SELECT g.*,
        w.name as white_name, b.name as black_name,
        w.rating as white_rating, b.rating as black_rating
       FROM games g
       LEFT JOIN users w ON g.white_player_id = w.id
       LEFT JOIN users b ON g.black_player_id = b.id
       WHERE (g.white_player_id=$1 OR g.black_player_id=$1) AND g.status='completed'
       ORDER BY g.created_at DESC LIMIT $2`,
      [req.params.id, limit]
    );
    res.json({ games: result.rows });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;

// GET /api/users/leaderboard/:academyId
router.get('/leaderboard/:academyId', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.rating, u.avatar,
        COUNT(DISTINCT g.id) FILTER (WHERE g.status='completed') as games_played,
        COUNT(DISTINCT g.id) FILTER (WHERE g.status='completed' AND (
          (g.result->>'winner'='white' AND g.white_player_id=u.id) OR
          (g.result->>'winner'='black' AND g.black_player_id=u.id)
        )) as wins,
        COALESCE(rh.streak, 0) as streak
       FROM users u
       LEFT JOIN games g ON (g.white_player_id=u.id OR g.black_player_id=u.id)
       LEFT JOIN LATERAL (
         SELECT COUNT(*) FILTER (WHERE is_correct) as streak
         FROM puzzle_attempts WHERE user_id=u.id AND attempted_at > NOW() - INTERVAL '7 days'
       ) rh ON true
       WHERE u.academy_id=$1 AND u.role='student' AND u.is_active=true
       GROUP BY u.id, u.name, u.rating, u.avatar, rh.streak
       ORDER BY u.rating DESC LIMIT 50`,
      [req.params.academyId]
    );
    res.json({ leaderboard: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to get leaderboard' }); }
});

// GET /api/users/children/:parentId/progress  
router.get('/children/:parentId/progress', async (req, res) => {
  try {
    if (req.user.id !== req.params.parentId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const result = await query(
      `SELECT u.id, u.name, u.rating,
        COUNT(DISTINCT g.id) FILTER (WHERE g.status='completed') as games_played,
        COUNT(DISTINCT pa.puzzle_id) FILTER (WHERE pa.is_correct) as puzzles_correct,
        COUNT(DISTINCT a.id) FILTER (WHERE sub.id IS NOT NULL) as assignments_done,
        COUNT(DISTINCT a.id) as assignments_total
       FROM parent_student ps
       JOIN users u ON ps.student_id=u.id
       LEFT JOIN games g ON (g.white_player_id=u.id OR g.black_player_id=u.id)
       LEFT JOIN puzzle_attempts pa ON pa.user_id=u.id
       LEFT JOIN assignments a ON a.student_id=u.id
       LEFT JOIN assignment_submissions sub ON sub.assignment_id=a.id AND sub.student_id=u.id
       WHERE ps.parent_id=$1
       GROUP BY u.id, u.name, u.rating`,
      [req.params.parentId]
    );
    res.json({ progress: result.rows });
  } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/users - Create a new user (academy admin or super admin)
router.post('/', authorize('academy_admin', 'super_admin', 'coach'), async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const { name, email, password, role, batchId, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });

    // Role hierarchy enforcement
    const ALLOWED = {
      super_admin: ['super_admin', 'academy_admin', 'coach', 'student', 'parent'],
      academy_admin: ['coach', 'student', 'parent'],
      coach: ['student'],
    };
    const targetRole = role || 'student';
    const allowed = ALLOWED[req.user.role] || [];
    if (!allowed.includes(targetRole)) {
      return res.status(403).json({ message: `${req.user.role} cannot create ${targetRole} accounts` });
    }

    const exists = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length > 0) return res.status(409).json({ message: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const academyId = req.user.role === 'super_admin' ? req.body.academyId : req.user.academy_id;
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, academy_id, phone, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW())`,
      [userId, name, email, hash, targetRole, academyId, phone || null]
    );
    if (batchId) {
      await query('INSERT INTO batch_students (batch_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [batchId, userId]);
    }
    const created = await query('SELECT id, name, email, role, rating FROM users WHERE id=$1', [userId]);
    // Send welcome email (fire-and-forget)
    try {
      const { sendWelcomeEmail } = require('../services/emailService');
      const acad = await require('../config/database').query('SELECT name FROM academies WHERE id=$1', [academy_id || req.user.academy_id]);
      sendWelcomeEmail({ to: email, name, role, academyName: acad.rows[0]?.name || 'Chess Academy' }).catch(() => { });
    } catch (_) { }
    res.status(201).json({ message: 'User created successfully', userId, user: created.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// POST /api/users/:id/link-parent - Link a parent to a student
router.post('/:id/link-parent', authorize('academy_admin', 'super_admin', 'coach'), async (req, res) => {
  try {
    const { parentEmail } = req.body;
    if (!parentEmail) return res.status(400).json({ message: 'Parent email required' });
    const parent = await query(`SELECT id FROM users WHERE email=$1 AND role='parent'`, [parentEmail]);
    if (parent.rows.length === 0) {
      // Create parent account automatically
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      const parentId = uuidv4();
      const hash = await bcrypt.hash('Parent@123', 10);
      const student = await query('SELECT name, academy_id FROM users WHERE id=$1', [req.params.id]);
      if (!student.rows[0]) return res.status(404).json({ message: 'Student not found' });
      const parentName = parentEmail.split('@')[0];
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, academy_id, is_active, created_at)
         VALUES ($1,$2,$3,$4,'parent',$5,true,NOW())`,
        [parentId, parentName, parentEmail, hash, student.rows[0].academy_id]
      );
      await query('INSERT INTO parent_student (parent_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [parentId, req.params.id]);
      return res.json({ message: 'Parent account created and linked. Temp password: Parent@123', parentId });
    }
    await query('INSERT INTO parent_student (parent_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [parent.rows[0].id, req.params.id]);
    res.json({ message: 'Parent linked successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to link parent' });
  }
});

// POST /api/users/:id/avatar - Upload avatar (base64 stored in DB)
router.post('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params
    if (req.user.id !== id && !['super_admin', 'academy_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    const { avatarBase64 } = req.body
    if (!avatarBase64) return res.status(400).json({ message: 'No image data' })
    if (avatarBase64.length > 500_000) return res.status(400).json({ message: 'Image too large (max ~350KB)' })
    await query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2', [avatarBase64, id])
    res.json({ message: 'Avatar updated', avatar: avatarBase64 })
  } catch (e) {
    res.status(500).json({ message: 'Failed to update avatar' })
  }
})