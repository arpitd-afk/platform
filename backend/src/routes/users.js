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
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(req.params.id)) return res.status(404).json({ message: 'Not found' });
    const { limit = 30 } = req.query;
    const result = await query(
      'SELECT rating, recorded_at as date FROM rating_history WHERE user_id=$1 ORDER BY recorded_at ASC LIMIT $2',
      [req.params.id, limit]
    );
    res.json({ history: result.rows });
  } catch (e) { console.error("[users]", e.message); res.status(500).json({ message: 'Failed', _route: 'users' }); }
});

// PUT /api/users/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(req.params.id)) return res.status(404).json({ message: 'Not found' });
    if (!['super_admin', 'academy_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { active } = req.body;
    await query('UPDATE users SET is_active=$1, updated_at=NOW() WHERE id=$2', [active, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (e) { console.error("[users]", e.message); res.status(500).json({ message: 'Failed', _route: 'users' }); }
});


// GET /api/users/:id/attendance
router.get('/:id/attendance', async (req, res) => {
  try {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(req.params.id)) return res.status(404).json({ message: 'Not found' });
    const result = await query(
      `SELECT cl.id as classroom_id, cl.title as class_title, cl.scheduled_at, cl.status as class_status,
        cl.duration_min, b.name as batch_name,
        CASE WHEN ca.student_id IS NOT NULL THEN 'present' ELSE 'absent' END as status,
        ca.joined_at, ca.duration_min as actual_duration_min
       FROM classrooms cl
       LEFT JOIN batches b ON b.id = cl.batch_id
       LEFT JOIN batch_enrollments be ON be.batch_id = cl.batch_id AND be.student_id = $1 AND be.is_active = true
       LEFT JOIN classroom_attendance ca ON ca.classroom_id = cl.id AND ca.student_id = $1
       WHERE (cl.status = 'completed' OR cl.status = 'live')
         AND (be.student_id = $1 OR ca.student_id = $1)
       ORDER BY cl.scheduled_at DESC LIMIT 60`,
      [req.params.id]
    );
    res.json({ attendance: result.rows });
  } catch (e) { console.error("[users]", e.message); res.status(500).json({ message: 'Failed', _route: 'users' }); }
});

// GET /api/users/:id/games
router.get('/:id/games', async (req, res) => {
  try {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(req.params.id)) return res.status(404).json({ message: 'Not found' });
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
  } catch (e) { console.error("[users]", e.message); res.status(500).json({ message: 'Failed', _route: 'users' }); }
});

module.exports = router;



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
    const academyId = req.user.role === 'super_admin' ? req.body.academyId : req.user.academyId;
    await query(
      'INSERT INTO users (id, name, email, password_hash, role, academy_id, phone, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW())',
      [userId, name, email, hash, targetRole, academyId, phone || null]
    );
    if (batchId) {
      await query('INSERT INTO batch_enrollments (batch_id, student_id, enrolled_at, is_active) VALUES ($1,$2,NOW(),true) ON CONFLICT (batch_id, student_id) DO NOTHING', [batchId, userId]);
    }
    const created = await query('SELECT id, name, email, role, rating FROM users WHERE id=$1', [userId]);
    // Send welcome email (fire-and-forget)
    try {
      const { sendWelcomeEmail } = require('../services/emailService');
      const acad = await require('../config/database').query('SELECT name FROM academies WHERE id=$1', [academyId]);
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
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(req.params.id)) return res.status(404).json({ message: 'Not found' });
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
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(req.params.id)) return res.status(404).json({ message: 'Not found' });
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