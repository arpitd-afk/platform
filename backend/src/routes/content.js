const { contentRouter } = require('./_combined');
module.exports = contentRouter;

const express2 = require('express');
const { query: dbQuery } = require('../config/database');
const { authenticate: auth2 } = require('../middleware/auth');
const { v4: uuid2 } = require('uuid');
const router2 = require('express').Router();

// These are extra routes added to the content module
module.exports.extraRoutes = (app) => {
  app.get('/api/content/lessons/:id', auth2, async (req, res) => {
    try {
      const r = await dbQuery('SELECT * FROM lessons WHERE id=$1', [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ message: 'Lesson not found' });
      res.json({ lesson: r.rows[0] });
    } catch { res.status(500).json({ message: 'Failed' }); }
  });
  app.post('/api/content/lessons/:id/complete', auth2, async (req, res) => {
    try {
      await dbQuery(
        'INSERT INTO lesson_progress (user_id, lesson_id, completed, watched_at) VALUES ($1,$2,true,NOW()) ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed=true, watched_at=NOW()',
        [req.user.id, req.params.id]
      );
      res.json({ message: 'Lesson marked complete' });
    } catch { res.status(500).json({ message: 'Failed' }); }
  });
  app.get('/api/content/my-progress', auth2, async (req, res) => {
    try {
      const r = await dbQuery(
        'SELECT lesson_id, completed, watched_at FROM lesson_progress WHERE user_id=$1',
        [req.user.id]
      );
      res.json({ progress: r.rows });
    } catch { res.status(500).json({ message: 'Failed' }); }
  });
};
