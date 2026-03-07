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
  } catch { res.status(500).json({ message: 'Failed' }); }
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
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// DELETE /api/classrooms/:id
router.delete('/:id', async (req, res) => {
  try {
    await query("UPDATE classrooms SET status='cancelled' WHERE id=$1", [req.params.id]);
    res.json({ message: 'Cancelled' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/classrooms/:id/start
router.post('/:id/start', async (req, res) => {
  try {
    await query("UPDATE classrooms SET status='live', started_at=NOW() WHERE id=$1", [req.params.id]);
    if (req.io) req.io.to(`classroom:${req.params.id}`).emit('classroom:started', { classroomId: req.params.id });
    res.json({ message: 'Started' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/classrooms/:id/end
router.post('/:id/end', async (req, res) => {
  try {
    await query("UPDATE classrooms SET status='completed', ended_at=NOW() WHERE id=$1", [req.params.id]);
    if (req.io) req.io.to(`classroom:${req.params.id}`).emit('classroom:ended', { classroomId: req.params.id });
    res.json({ message: 'Ended' });
  } catch { res.status(500).json({ message: 'Failed' }); }
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
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/classrooms/:id/pgn
router.post('/:id/pgn', async (req, res) => {
  try {
    const { pgn, fen } = req.body;
    await query('UPDATE classrooms SET pgn=$1, board_fen=$2 WHERE id=$3', [pgn, fen, req.params.id]);
    if (req.io) req.io.to(`classroom:${req.params.id}`).emit('board:sync', { pgn, fen });
    res.json({ message: 'Saved' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
