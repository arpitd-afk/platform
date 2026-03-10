const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { classroomsRouter } = require('./_combined');
const router = classroomsRouter;

// GET /api/classrooms/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, u.name as coach_name, b.name as batch_name
       FROM classrooms c
       LEFT JOIN users u ON c.coach_id=u.id
       LEFT JOIN batches b ON c.batch_id=b.id
       WHERE c.id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ classroom: result.rows[0] });
  } catch (e) { console.error("[classrooms]", e.message); res.status(500).json({ message: 'Failed', _route: 'classrooms' }); }
});

// PUT /api/classrooms/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, scheduledAt, durationMin } = req.body;
    await query(
      'UPDATE classrooms SET title=COALESCE($1,title), description=COALESCE($2,description), scheduled_at=COALESCE($3,scheduled_at), duration_min=COALESCE($4,duration_min), updated_at=NOW() WHERE id=$5',
      [title, description, scheduledAt, durationMin, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (e) { console.error("[classrooms]", e.message); res.status(500).json({ message: 'Failed', _route: 'classrooms' }); }
});

// DELETE /api/classrooms/:id
router.delete('/:id', async (req, res) => {
  try {
    await query("UPDATE classrooms SET status='cancelled' WHERE id=$1", [req.params.id]);
    res.json({ message: 'Cancelled' });
  } catch (e) { console.error("[classrooms]", e.message); res.status(500).json({ message: 'Failed', _route: 'classrooms' }); }
});

// POST /api/classrooms/:id/start
router.post('/:id/start', async (req, res) => {
  try {
    await query("UPDATE classrooms SET status='live', started_at=NOW() WHERE id=$1", [req.params.id]);
    if (req.io) req.io.to(`classroom:${req.params.id}`).emit('classroom:started', { classroomId: req.params.id });
    res.json({ message: 'Started' });
  } catch (e) { console.error("[classrooms]", e.message); res.status(500).json({ message: 'Failed', _route: 'classrooms' }); }
});

// POST /api/classrooms/:id/end
router.post('/:id/end', async (req, res) => {
  try {
    await query("UPDATE classrooms SET status='completed', ended_at=NOW() WHERE id=$1", [req.params.id]);
    if (req.io) req.io.to(`classroom:${req.params.id}`).emit('classroom:ended', { classroomId: req.params.id });
    res.json({ message: 'Ended' });
  } catch (e) { console.error("[classrooms]", e.message); res.status(500).json({ message: 'Failed', _route: 'classrooms' }); }
});

// GET /api/classrooms/:id/attendance
router.get('/:id/attendance', async (req, res) => {
  try {
    const result = await query(
      `SELECT ca.*, u.name as student_name, u.email, u.rating
       FROM classroom_attendance ca
       JOIN users u ON ca.student_id=u.id
       WHERE ca.classroom_id=$1 ORDER BY ca.joined_at ASC`,
      [req.params.id]
    );
    res.json({ attendance: result.rows });
  } catch (e) { console.error("[classrooms]", e.message); res.status(500).json({ message: 'Failed', _route: 'classrooms' }); }
});

// POST /api/classrooms/:id/pgn
router.post('/:id/pgn', async (req, res) => {
  try {
    const { pgn, fen } = req.body;
    await query('UPDATE classrooms SET pgn=$1, board_fen=$2 WHERE id=$3', [pgn, fen, req.params.id]);
    if (req.io) req.io.to(`classroom:${req.params.id}`).emit('board:sync', { pgn, fen });
    res.json({ message: 'Saved' });
  } catch (e) { console.error("[classrooms]", e.message); res.status(500).json({ message: 'Failed', _route: 'classrooms' }); }
});

module.exports = router;

// POST /api/classrooms/:id/attendance — coach marks attendance for a student
router.post('/:id/attendance', async (req, res) => {
  try {
    const { studentId, present } = req.body;
    if (present) {
      await query(
        `INSERT INTO classroom_attendance (classroom_id, student_id, joined_at, duration_min)
         VALUES ($1, $2, NOW(), 0)
         ON CONFLICT (classroom_id, student_id) DO UPDATE SET joined_at = NOW()`,
        [req.params.id, studentId]
      );
    } else {
      await query(
        'DELETE FROM classroom_attendance WHERE classroom_id=$1 AND student_id=$2',
        [req.params.id, studentId]
      );
    }
    res.json({ message: 'Attendance updated' });
  } catch (e) { console.error('[classrooms]', e.message); res.status(500).json({ message: 'Failed to update attendance' }); }
});

// POST /api/classrooms/:id/attendance/bulk — mark all at once
router.post('/:id/attendance/bulk', async (req, res) => {
  try {
    const { present = [], absent = [] } = req.body;
    for (const studentId of present) {
      await query(
        `INSERT INTO classroom_attendance (classroom_id, student_id, joined_at, duration_min)
         VALUES ($1, $2, NOW(), 0) ON CONFLICT (classroom_id, student_id) DO NOTHING`,
        [req.params.id, studentId]
      );
    }
    for (const studentId of absent) {
      await query(
        'DELETE FROM classroom_attendance WHERE classroom_id=$1 AND student_id=$2',
        [req.params.id, studentId]
      );
    }
    // Notify parents of absent students
    const classResult = await query('SELECT title FROM classrooms WHERE id=$1', [req.params.id]);
    const className = classResult.rows[0]?.title || 'class';
    for (const studentId of absent) {
      const parents = await query(
        `SELECT ps.parent_id FROM parent_student ps WHERE ps.student_id=$1`, [studentId]
      );
      const student = await query('SELECT name FROM users WHERE id=$1', [studentId]);
      for (const p of parents.rows) {
        await query(
          `INSERT INTO notifications (id, user_id, type, title, body, data)
           VALUES (gen_random_uuid(), $1, 'attendance_absent', $2, $3, $4)`,
          [p.parent_id, 'Attendance Alert',
          `${student.rows[0]?.name || 'Your child'} was marked absent from "${className}"`,
          JSON.stringify({ studentId, classroomId: req.params.id })]
        );
      }
    }
    res.json({ message: 'Bulk attendance saved' });
  } catch (e) { console.error('[classrooms]', e.message); res.status(500).json({ message: 'Failed' }); }
});

// GET /api/classrooms/coach/summary — coach sees all their classrooms with attendance stats
router.get('/coach/summary', async (req, res) => {
  try {
    const result = await query(
      `SELECT cl.id, cl.title, cl.scheduled_at, cl.status, cl.batch_id, cl.duration_min,
        b.name as batch_name,
        COUNT(DISTINCT be.student_id) as enrolled,
        COUNT(DISTINCT ca.student_id) as attended
       FROM classrooms cl
       LEFT JOIN batches b ON b.id = cl.batch_id
       LEFT JOIN batch_enrollments be ON be.batch_id = cl.batch_id AND be.is_active = true
       LEFT JOIN classroom_attendance ca ON ca.classroom_id = cl.id
       WHERE cl.coach_id = $1
       GROUP BY cl.id, cl.title, cl.scheduled_at, cl.status, cl.batch_id, cl.duration_min, b.name
       ORDER BY cl.scheduled_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ classes: result.rows });
  } catch (e) { console.error('[classrooms]', e.message); res.status(500).json({ message: 'Failed' }); }
});