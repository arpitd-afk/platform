// ============================================================
// assignments.js — Full assignment + grading system
// ============================================================
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { assignmentsRouter } = require('./_combined');

const router = assignmentsRouter;

// ─── GET / — List assignments (from _combined base route) ──────────────────
// Already handles role-based filtering in _combined.js

// ─── GET /:id — Single assignment + my submission if student ──────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*,
        u.name as coach_name,
        b.name as batch_name,
        s.name as student_name,
        (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id) as total_submissions,
        (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id AND graded_at IS NOT NULL) as graded_count
       FROM assignments a
       LEFT JOIN users u ON a.coach_id = u.id
       LEFT JOIN batches b ON a.batch_id = b.id
       LEFT JOIN users s ON a.student_id = s.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Assignment not found' });

    let mySubmission = null;
    if (req.user.role === 'student') {
      const sub = await query(
        `SELECT * FROM assignment_submissions
         WHERE assignment_id=$1 AND student_id=$2
         ORDER BY submitted_at DESC LIMIT 1`,
        [req.params.id, req.user.id]
      );
      mySubmission = sub.rows[0] || null;
    }

    res.json({ assignment: result.rows[0], mySubmission });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get assignment' });
  }
});

// ─── PUT /:id — Update assignment ─────────────────────────────────────────
router.put('/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { title, description, type, dueDate, content, passingScore, maxAttempts } = req.body;
    await query(
      `UPDATE assignments SET
        title        = COALESCE($1, title),
        description  = COALESCE($2, description),
        type         = COALESCE($3, type),
        due_date     = COALESCE($4, due_date),
        content      = COALESCE($5, content),
        passing_score = COALESCE($6, passing_score),
        max_attempts  = COALESCE($7, max_attempts),
        updated_at   = NOW()
       WHERE id = $8 AND coach_id = $9`,
      [title, description, type, dueDate, content, passingScore, maxAttempts, req.params.id, req.user.id]
    );
    res.json({ message: 'Assignment updated' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update' });
  }
});

// ─── DELETE /:id — Delete assignment ──────────────────────────────────────
router.delete('/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    await query(
      'DELETE FROM assignments WHERE id=$1 AND coach_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Assignment deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete' });
  }
});

// ─── GET /:id/submissions — All submissions for an assignment ──────────────
router.get('/:id/submissions', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT
        sub.*,
        u.name    as student_name,
        u.email   as student_email,
        u.avatar  as student_avatar,
        u.rating  as student_rating,
        b.name    as batch_name,
        grader.name as graded_by_name
       FROM assignment_submissions sub
       JOIN users u ON sub.student_id = u.id
       LEFT JOIN batch_enrollments be ON be.student_id = u.id
       LEFT JOIN batches b ON be.batch_id = b.id
       LEFT JOIN users grader ON sub.graded_by = grader.id
       WHERE sub.assignment_id = $1
       ORDER BY sub.submitted_at DESC`,
      [req.params.id]
    );
    res.json({ submissions: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get submissions' });
  }
});

// ─── PUT /:id/submissions/:subId/grade — Grade a submission ───────────────
router.put('/:id/submissions/:subId/grade', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    if (grade !== undefined && (isNaN(grade) || grade < 0 || grade > 100)) {
      return res.status(400).json({ message: 'Grade must be 0–100' });
    }

    await query(
      `UPDATE assignment_submissions
       SET grade=$1, feedback=$2, graded_by=$3, graded_at=NOW()
       WHERE id=$4 AND assignment_id=$5`,
      [grade ?? null, feedback ?? null, req.user.id, req.params.subId, req.params.id]
    );

    // Check passing score and create notification for student
    const subRes = await query(
      `SELECT sub.student_id, a.title, a.passing_score
       FROM assignment_submissions sub
       JOIN assignments a ON sub.assignment_id = a.id
       WHERE sub.id=$1`,
      [req.params.subId]
    );
    if (subRes.rows.length) {
      const { student_id, title, passing_score } = subRes.rows[0];
      const passed = grade >= (passing_score || 70);
      await query(
        `INSERT INTO notifications (id, user_id, type, title, body, created_at)
         VALUES ($1,$2,'assignment',$3,$4,NOW())`,
        [
          uuidv4(), student_id,
          `Assignment graded: ${title}`,
          grade !== undefined
            ? `You scored ${grade}/100 on "${title}". ${passed ? '✅ Passed!' : '❌ Below passing score.'}`
            : `Feedback added to "${title}"`,
        ]
      );
    }

    // Send grade email (fire-and-forget)
    if (subRes.rows.length) {
      try {
        const { sendGradeNotificationEmail } = require('../services/emailService');
        const { student_id, title, passing_score } = subRes.rows[0];
        const stuEmail = await query('SELECT email, name FROM users WHERE id=$1', [student_id]);
        if (stuEmail.rows[0]) {
          sendGradeNotificationEmail({
            to: stuEmail.rows[0].email, name: stuEmail.rows[0].name,
            assignmentTitle: title, score: grade, maxScore: 100,
            passed: grade >= (passing_score || 70),
            feedback, coachName: req.user.name,
          }).catch(() => { });
        }
      } catch (_) { }
    }
    res.json({ message: 'Submission graded successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to grade submission' });
  }
});

// ─── Legacy POST /:id/grade — kept for backwards compat ───────────────────
router.post('/:id/grade', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { submissionId, grade, feedback } = req.body;
    await query(
      `UPDATE assignment_submissions
       SET grade=$1, feedback=$2, graded_by=$3, graded_at=NOW()
       WHERE id=$4`,
      [grade, feedback, req.user.id, submissionId]
    );
    res.json({ message: 'Graded' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to grade' });
  }
});

module.exports = router;