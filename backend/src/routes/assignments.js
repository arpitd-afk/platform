const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { assignmentsRouter } = require('./_combined');
const router = assignmentsRouter;

// GET /api/assignments/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.name as coach_name FROM assignments a
       LEFT JOIN users u ON a.coach_id=u.id WHERE a.id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    // Get student submission if student
    if (req.user.role === 'student') {
      const sub = await query(
        'SELECT * FROM assignment_submissions WHERE assignment_id=$1 AND student_id=$2 ORDER BY submitted_at DESC LIMIT 1',
        [req.params.id, req.user.id]
      );
      return res.json({ assignment: result.rows[0], mySubmission: sub.rows[0] || null });
    }
    res.json({ assignment: result.rows[0] });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// PUT /api/assignments/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, type, dueDate } = req.body;
    await query(
      'UPDATE assignments SET title=COALESCE($1,title), description=COALESCE($2,description), type=COALESCE($3,type), due_date=COALESCE($4,due_date), updated_at=NOW() WHERE id=$5',
      [title, description, type, dueDate, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM assignments WHERE id=$1 AND coach_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/assignments/:id/submissions
router.get('/:id/submissions', async (req, res) => {
  try {
    const result = await query(
      `SELECT sub.*, u.name as student_name, u.email as student_email, u.rating
       FROM assignment_submissions sub
       JOIN users u ON sub.student_id=u.id
       WHERE sub.assignment_id=$1
       ORDER BY sub.submitted_at DESC`,
      [req.params.id]
    );
    res.json({ submissions: result.rows });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/assignments/:id/grade
router.post('/:id/grade', async (req, res) => {
  try {
    if (!['coach','academy_admin','super_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { submissionId, grade, feedback } = req.body;
    await query(
      'UPDATE assignment_submissions SET grade=$1, feedback=$2, graded_at=NOW() WHERE id=$3',
      [grade, feedback, submissionId]
    );
    res.json({ message: 'Graded' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
