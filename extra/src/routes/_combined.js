const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ─── USERS ROUTER ────────────────────────────────────────────────────────────
const usersRouter = express.Router();
usersRouter.use(authenticate);

usersRouter.get('/', async (req, res) => {
  try {
    const { academyId, role, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = ['is_active = true'];
    const params = [];

    const targetAcademy = academyId || req.user.academyId;
    if (targetAcademy) { params.push(targetAcademy); conditions.push(`academy_id = $${params.length}`); }
    if (role) { params.push(role); conditions.push(`role = $${params.length}`); }

    params.push(limit, offset);
    const result = await query(
      `SELECT id, name, email, role, rating, avatar, is_active, last_login_at, created_at
       FROM users WHERE ${conditions.join(' AND ')}
       ORDER BY name ASC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    res.json({ users: result.rows });
  } catch { res.status(500).json({ message: 'Failed to get users' }); }
});

usersRouter.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.rating, u.avatar, u.bio, u.created_at,
        a.name as academy_name
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id WHERE u.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch { res.status(500).json({ message: 'Failed to get user' }); }
});

usersRouter.put('/:id', async (req, res) => {
  try {
    if (req.user.id !== req.params.id && !['super_admin','academy_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, bio, phone } = req.body;
    await query('UPDATE users SET name=COALESCE($1,name), bio=COALESCE($2,bio), updated_at=NOW() WHERE id=$3',
      [name, bio, req.params.id]);
    res.json({ message: 'Updated' });
  } catch { res.status(500).json({ message: 'Update failed' }); }
});

usersRouter.get('/:id/stats', async (req, res) => {
  try {
    const [games, puzzles, rating] = await Promise.all([
      query(`SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE (result->>'winner'='white' AND white_player_id=$1) OR (result->>'winner'='black' AND black_player_id=$1)) as wins
        FROM games WHERE (white_player_id=$1 OR black_player_id=$1) AND status='completed'`, [req.params.id]),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_correct) as correct FROM puzzle_attempts WHERE user_id=$1', [req.params.id]),
      query('SELECT rating FROM users WHERE id=$1', [req.params.id]),
    ]);
    res.json({
      rating: rating.rows[0]?.rating,
      games: games.rows[0],
      puzzles: puzzles.rows[0],
    });
  } catch { res.status(500).json({ message: 'Failed to get stats' }); }
});

// ─── ASSIGNMENTS ROUTER ───────────────────────────────────────────────────────
const assignmentsRouter = express.Router();
assignmentsRouter.use(authenticate);

assignmentsRouter.get('/', async (req, res) => {
  try {
    const { studentId, batchId } = req.query;
    const conditions = [];
    const params = [];
    if (studentId) { params.push(studentId); conditions.push(`(a.student_id=$${params.length} OR a.batch_id IN (SELECT batch_id FROM batch_enrollments WHERE student_id=$${params.length}))`); }
    if (batchId) { params.push(batchId); conditions.push(`a.batch_id=$${params.length}`); }
    const result = await query(
      `SELECT a.*, u.name as coach_name FROM assignments a
       LEFT JOIN users u ON a.coach_id=u.id
       ${conditions.length ? 'WHERE '+conditions.join(' AND ') : ''}
       ORDER BY a.created_at DESC`,
      params
    );
    res.json({ assignments: result.rows });
  } catch { res.status(500).json({ message: 'Failed to get assignments' }); }
});

assignmentsRouter.post('/', async (req, res) => {
  try {
    if (!['coach','academy_admin','super_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { title, description, type, batchId, studentId, dueDate, content } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO assignments (id, coach_id, batch_id, student_id, title, description, type, due_date, content, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())',
      [id, req.user.id, batchId||null, studentId||null, title, description, type||'puzzle', dueDate, JSON.stringify(content||{})]
    );
    res.status(201).json({ message: 'Assignment created', id });
  } catch { res.status(500).json({ message: 'Failed to create assignment' }); }
});

assignmentsRouter.post('/:id/submit', async (req, res) => {
  try {
    const { submission } = req.body;
    const id = uuidv4();
    const attempt = await query(
      'SELECT COUNT(*)+1 as num FROM assignment_submissions WHERE assignment_id=$1 AND student_id=$2',
      [req.params.id, req.user.id]
    );
    await query(
      'INSERT INTO assignment_submissions (id, assignment_id, student_id, attempt_number, submission, submitted_at) VALUES ($1,$2,$3,$4,$5,NOW())',
      [id, req.params.id, req.user.id, parseInt(attempt.rows[0].num), JSON.stringify(submission)]
    );
    res.status(201).json({ message: 'Submitted', submissionId: id });
  } catch { res.status(500).json({ message: 'Submission failed' }); }
});

// ─── PUZZLES ROUTER ───────────────────────────────────────────────────────────
const puzzlesRouter = express.Router();
puzzlesRouter.use(authenticate);

puzzlesRouter.get('/daily', async (req, res) => {
  try {
    const result = await query('SELECT * FROM puzzles ORDER BY nb_plays ASC, rating DESC LIMIT 1');
    res.json({ puzzle: result.rows[0] || null });
  } catch { res.status(500).json({ message: 'Failed to get puzzle' }); }
});

puzzlesRouter.get('/random', async (req, res) => {
  try {
    const { difficulty } = req.query;
    const ratingRanges = { beginner: [800,1200], intermediate: [1200,1600], advanced: [1600,2000], expert: [2000,3000] };
    const [min, max] = ratingRanges[difficulty] || [1000, 1800];
    const result = await query(
      'SELECT * FROM puzzles WHERE rating BETWEEN $1 AND $2 ORDER BY RANDOM() LIMIT 1',
      [min, max]
    );
    res.json({ puzzle: result.rows[0] || null });
  } catch { res.status(500).json({ message: 'Failed to get puzzle' }); }
});

puzzlesRouter.post('/:id/submit', async (req, res) => {
  try {
    const { moves, timeTakenMs } = req.body;
    const puzzle = await query('SELECT moves FROM puzzles WHERE id=$1', [req.params.id]);
    if (!puzzle.rows.length) return res.status(404).json({ message: 'Puzzle not found' });
    const expected = puzzle.rows[0].moves.split(' ');
    const isCorrect = JSON.stringify(moves) === JSON.stringify(expected);
    await query(
      'INSERT INTO puzzle_attempts (id, puzzle_id, user_id, is_correct, time_taken_ms, attempted_at) VALUES ($1,$2,$3,$4,$5,NOW())',
      [uuidv4(), req.params.id, req.user.id, isCorrect, timeTakenMs||null]
    );
    res.json({ isCorrect, correct: expected });
  } catch { res.status(500).json({ message: 'Submission failed' }); }
});

// ─── NOTIFICATIONS ROUTER ─────────────────────────────────────────────────────
const notificationsRouter = express.Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page)-1)*Number(limit);
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ notifications: result.rows });
  } catch { res.status(500).json({ message: 'Failed to get notifications' }); }
});

notificationsRouter.get('/unread-count', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false', [req.user.id]);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

notificationsRouter.put('/:id/read', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

notificationsRouter.put('/read-all', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// ─── CLASSROOMS ROUTER ────────────────────────────────────────────────────────
const classroomsRouter = express.Router();
classroomsRouter.use(authenticate);

classroomsRouter.get('/', async (req, res) => {
  try {
    const conditions = [];
    const params = [];
    if (req.user.role === 'coach') { params.push(req.user.id); conditions.push(`c.coach_id=$${params.length}`); }
    else if (req.user.academyId) { params.push(req.user.academyId); conditions.push(`c.academy_id=$${params.length}`); }
    const result = await query(
      `SELECT c.*, u.name as coach_name, b.name as batch_name
       FROM classrooms c
       LEFT JOIN users u ON c.coach_id=u.id
       LEFT JOIN batches b ON c.batch_id=b.id
       ${conditions.length ? 'WHERE '+conditions.join(' AND ') : ''}
       ORDER BY c.scheduled_at DESC LIMIT 50`,
      params
    );
    res.json({ classrooms: result.rows });
  } catch { res.status(500).json({ message: 'Failed to get classrooms' }); }
});

classroomsRouter.post('/', async (req, res) => {
  try {
    if (!['coach','academy_admin','super_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { title, batchId, scheduledAt, durationMin = 60, description } = req.body;
    const id = uuidv4();
    await query(
      'INSERT INTO classrooms (id, academy_id, coach_id, batch_id, title, description, scheduled_at, duration_min, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,\'scheduled\',NOW())',
      [id, req.user.academyId, req.user.id, batchId||null, title, description||null, scheduledAt, durationMin]
    );
    res.status(201).json({ message: 'Classroom created', id });
  } catch { res.status(500).json({ message: 'Failed to create classroom' }); }
});

// ─── CONTENT ROUTER ───────────────────────────────────────────────────────────
const contentRouter = express.Router();
contentRouter.use(authenticate);
contentRouter.get('/lessons', async (req, res) => {
  try {
    const { academyId, level } = req.query;
    const conditions = ['is_published=true'];
    const params = [];
    if (academyId) { params.push(academyId); conditions.push(`academy_id=$${params.length}`); }
    if (level) { params.push(level); conditions.push(`level=$${params.length}`); }
    const result = await query(`SELECT * FROM lessons WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 50`, params);
    res.json({ lessons: result.rows });
  } catch { res.status(500).json({ message: 'Failed to get lessons' }); }
});

// ─── ANTI-CHEAT ROUTER ────────────────────────────────────────────────────────
const anticheatRouter = express.Router();
anticheatRouter.use(authenticate);
anticheatRouter.get('/reports', async (req, res) => {
  try {
    const result = await query('SELECT cr.*, u.name as reported_name FROM cheat_reports cr LEFT JOIN users u ON cr.reported_user=u.id ORDER BY cr.created_at DESC LIMIT 50');
    res.json({ reports: result.rows });
  } catch { res.status(500).json({ message: 'Failed to get reports' }); }
});

// ─── BILLING ROUTER ───────────────────────────────────────────────────────────
const billingRouter = express.Router();
billingRouter.use(authenticate);
billingRouter.get('/plans', async (req, res) => {
  try {
    const result = await query('SELECT * FROM subscription_plans WHERE is_active=true ORDER BY price_monthly ASC');
    res.json({ plans: result.rows });
  } catch { res.status(500).json({ message: 'Failed to get plans' }); }
});
billingRouter.get('/invoices/:academyId', async (req, res) => {
  try {
    const result = await query('SELECT * FROM invoices WHERE academy_id=$1 ORDER BY created_at DESC', [req.params.academyId]);
    res.json({ invoices: result.rows });
  } catch { res.status(500).json({ message: 'Failed to get invoices' }); }
});

// ─── EMAIL SERVICE STUB ───────────────────────────────────────────────────────
async function sendEmail({ to, subject, template, data }) {
  console.log(`[Email] To: ${to} | Subject: ${subject} | Template: ${template}`);
  // In production, use nodemailer or SendGrid here
}

module.exports = {
  usersRouter,
  assignmentsRouter,
  puzzlesRouter,
  notificationsRouter,
  classroomsRouter,
  contentRouter,
  anticheatRouter,
  billingRouter,
  sendEmail,
};
