// ============================================================
// content.js — Full PGN Library / Lesson management
// ============================================================
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { contentRouter } = require('./_combined');

const router = contentRouter;

// ─── GET /lessons — List lessons (published + academy filter) ──
// Already defined in _combined for students. Override with richer version:
// (Router picks first matching route — we add new routes below)

// ─── GET /lessons/mine — Coach's own lessons (all, incl. drafts) ──
router.get('/lessons/mine', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { level, search } = req.query;
    // Match by author OR by academy (catches NULL academy_id records too)
    const conditions = ['(l.author_id = $1 OR (l.academy_id = $2 AND (l.academy_id IS NOT NULL)))'];
    const params = [req.user.id, req.user.academyId];

    if (level) { params.push(level); conditions.push(`l.level = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`); }

    const result = await query(
      `SELECT l.*,
        u.name as author_name,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.lesson_id = l.id AND lp.completed = true) as completed_count,
        (SELECT COUNT(*) FROM lesson_progress lp2 WHERE lp2.lesson_id = l.id) as views_count
       FROM lessons l
       LEFT JOIN users u ON l.author_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY l.created_at DESC`,
      params
    );
    res.json({ lessons: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get lessons' });
  }
});

// ─── GET /lessons/:id — Single lesson ─────────────────────────
router.get('/lessons/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT l.*, u.name as author_name,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.lesson_id = l.id AND lp.completed = true) as completed_count
       FROM lessons l
       LEFT JOIN users u ON l.author_id = u.id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Lesson not found' });

    let myProgress = null;
    if (req.user.role === 'student') {
      const p = await query(
        'SELECT * FROM lesson_progress WHERE user_id=$1 AND lesson_id=$2',
        [req.user.id, req.params.id]
      );
      myProgress = p.rows[0] || null;
    }

    res.json({ lesson: result.rows[0], myProgress });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

// ─── POST /lessons — Create lesson ────────────────────────────
router.post('/lessons', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const {
      title, description, pgn = '', videoUrl = '', level = 'beginner',
      tags = [], content = {}, isPublished = false, thumbnailUrl = ''
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });

    const id = uuidv4();
    await query(
      `INSERT INTO lessons
        (id, academy_id, author_id, title, description, pgn, video_url, thumbnail_url,
         level, tags, content, is_published, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
      [id, req.user.academyId, req.user.id, title, description, pgn,
        videoUrl, thumbnailUrl, level, tags, JSON.stringify(content), isPublished]
    );
    res.status(201).json({ message: 'Lesson created', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create lesson' });
  }
});

// ─── PUT /lessons/:id — Update lesson ─────────────────────────
router.put('/lessons/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const {
      title, description, pgn, videoUrl, thumbnailUrl,
      level, tags, content, isPublished
    } = req.body;

    await query(
      `UPDATE lessons SET
        title         = COALESCE($1, title),
        description   = COALESCE($2, description),
        pgn           = COALESCE($3, pgn),
        video_url     = COALESCE($4, video_url),
        thumbnail_url = COALESCE($5, thumbnail_url),
        level         = COALESCE($6, level),
        tags          = COALESCE($7, tags),
        content       = COALESCE($8, content),
        is_published  = COALESCE($9, is_published),
        updated_at    = NOW()
       WHERE id = $10 AND (author_id = $11 OR $12 = 'academy_admin' OR $12 = 'super_admin')`,
      [title, description, pgn, videoUrl, thumbnailUrl,
        level, tags, content ? JSON.stringify(content) : null,
        isPublished, req.params.id, req.user.id, req.user.role]
    );
    res.json({ message: 'Lesson updated' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update' });
  }
});

// ─── PUT /lessons/:id/publish — Toggle publish ─────────────────
router.put('/lessons/:id/publish', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { publish } = req.body; // true | false
    await query(
      'UPDATE lessons SET is_published=$1, updated_at=NOW() WHERE id=$2',
      [publish, req.params.id]
    );
    res.json({ message: publish ? 'Lesson published' : 'Lesson unpublished' });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

// ─── DELETE /lessons/:id — Delete lesson ──────────────────────
router.delete('/lessons/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    await query(
      'DELETE FROM lessons WHERE id=$1 AND (author_id=$2 OR $3=\'super_admin\' OR $3=\'academy_admin\')',
      [req.params.id, req.user.id, req.user.role]
    );
    res.json({ message: 'Lesson deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete' });
  }
});

// ─── POST /lessons/:id/complete — Mark complete ──────────────
router.post('/lessons/:id/complete', async (req, res) => {
  try {
    await query(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, watched_at)
       VALUES ($1,$2,true,NOW())
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET completed=true, watched_at=NOW()`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Marked as complete' });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

// ─── GET /my-progress — Student lesson progress ───────────────
router.get('/my-progress', async (req, res) => {
  try {
    const r = await query(
      'SELECT lesson_id, completed, watched_at FROM lesson_progress WHERE user_id=$1',
      [req.user.id]
    );
    res.json({ progress: r.rows });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

// ─── GET /courses — List courses ──────────────────────────────
router.get('/courses', async (req, res) => {
  try {
    const params = [];
    const conditions = [];
    if (req.user.role !== 'super_admin') {
      params.push(req.user.academyId);
      conditions.push(`c.academy_id = $${params.length}`);
    }
    if (req.user.role === 'student') {
      conditions.push('c.is_published = true');
    }

    const result = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM course_lessons WHERE course_id = c.id) as lesson_count
       FROM courses c
       WHERE ${conditions.length ? conditions.join(' AND ') : '1=1'}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json({ courses: result.rows });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get courses' });
  }
});

// ─── POST /courses — Create course ────────────────────────────
router.post('/courses', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { title, description, level = 'beginner', isPublished = false } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const id = uuidv4();
    await query(
      `INSERT INTO courses (id, academy_id, title, description, level, is_published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [id, req.user.academyId, title, description, level, isPublished]
    );
    res.status(201).json({ message: 'Course created', id });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

// ─── POST /courses/:id/lessons — Add lesson to course ─────────
router.post('/courses/:id/lessons', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { lessonId, orderIndex = 0 } = req.body;
    await query(
      'INSERT INTO course_lessons (course_id, lesson_id, order_index) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [req.params.id, lessonId, orderIndex]
    );
    res.json({ message: 'Lesson added to course' });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

module.exports = router;