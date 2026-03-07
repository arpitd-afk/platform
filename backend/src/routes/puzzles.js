const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { puzzlesRouter } = require('./_combined');
const router = puzzlesRouter;

// GET /api/puzzles/my-stats
router.get('/my-stats', async (req, res) => {
  try {
    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_correct) as correct,
        ROUND(100.0*COUNT(*) FILTER (WHERE is_correct)/NULLIF(COUNT(*),0),1) as accuracy,
        COUNT(DISTINCT DATE(attempted_at)) as days_practiced,
        MAX(attempted_at) as last_attempted
       FROM puzzle_attempts WHERE user_id=$1`,
      [req.user.id]
    );
    const streak = await query(
      `SELECT COUNT(*) as streak FROM (
        SELECT DATE(attempted_at) as d,
          DATE(attempted_at) - ROW_NUMBER() OVER (ORDER BY DATE(attempted_at) DESC)::int * interval '1 day' as grp
        FROM (SELECT DISTINCT DATE(attempted_at) FROM puzzle_attempts WHERE user_id=$1 ORDER BY 1 DESC LIMIT 100) t
      ) g WHERE grp = (SELECT DATE(attempted_at) - 1::int * interval '1 day' FROM puzzle_attempts WHERE user_id=$1 ORDER BY attempted_at DESC LIMIT 1)`,
      [req.user.id]
    );
    res.json({ stats: { ...result.rows[0], streak: parseInt(streak.rows[0]?.streak || 0) } });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/puzzles/history
router.get('/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await query(
      `SELECT pa.*, p.fen, p.rating as puzzle_rating, p.themes
       FROM puzzle_attempts pa JOIN puzzles p ON pa.puzzle_id=p.id
       WHERE pa.user_id=$1 ORDER BY pa.attempted_at DESC LIMIT $2`,
      [req.user.id, limit]
    );
    res.json({ history: result.rows });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/puzzles/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM puzzles WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ puzzle: result.rows[0] });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
