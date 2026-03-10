const express = require('express');
const { query } = require('../config/database');
const { cache } = require('../config/redis');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/analytics/students/:studentId
router.get('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period = '30d' } = req.query;

    // Auth check
    const canAccess =
      req.user.id === studentId ||
      req.user.role === 'super_admin' ||
      req.user.role === 'academy_admin' ||
      req.user.role === 'coach';
    if (!canAccess) return res.status(403).json({ message: 'Access denied' });

    const cacheKey = `analytics:student:${studentId}:${period}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const intervalMap = { '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' };
    const interval = intervalMap[period] || '30 days';

    const [gamesStats, ratingHistory, openings, puzzleStats] = await Promise.all([
      query(
        `SELECT
          COUNT(*) as total_games,
          COUNT(*) FILTER (WHERE
            (g.result->>'winner' = 'white' AND g.white_player_id = $1) OR
            (g.result->>'winner' = 'black' AND g.black_player_id = $1)
          ) as wins,
          COUNT(*) FILTER (WHERE g.result->>'winner' IS NULL AND g.status = 'completed') as draws,
          AVG(EXTRACT(EPOCH FROM (g.updated_at - g.created_at))/60)::INT as avg_game_minutes
         FROM games g
         WHERE (g.white_player_id = $1 OR g.black_player_id = $1)
           AND g.status = 'completed'
           AND g.created_at > NOW() - INTERVAL '${interval}'`,
        [studentId]
      ),
      query(
        `SELECT rating, recorded_at::date as date
         FROM rating_history
         WHERE user_id = $1
           AND recorded_at > NOW() - INTERVAL '${interval}'
         ORDER BY recorded_at ASC`,
        [studentId]
      ),
      query(
        `SELECT opening_name, COUNT(*) as games,
           COUNT(*) FILTER (WHERE
             (result->>'winner' = 'white' AND white_player_id = $1) OR
             (result->>'winner' = 'black' AND black_player_id = $1)
           ) as wins
         FROM games
         WHERE (white_player_id = $1 OR black_player_id = $1)
           AND opening_name IS NOT NULL
           AND status = 'completed'
           AND created_at > NOW() - INTERVAL '${interval}'
         GROUP BY opening_name
         ORDER BY games DESC
         LIMIT 10`,
        [studentId]
      ),
      query(
        `SELECT
           COUNT(*) as total_puzzles,
           COUNT(*) FILTER (WHERE is_correct) as correct_puzzles,
           AVG(time_taken_ms) as avg_time_ms
         FROM puzzle_attempts
         WHERE user_id = $1
           AND attempted_at > NOW() - INTERVAL '${interval}'`,
        [studentId]
      ),
    ]);

    const gs = gamesStats.rows[0];
    const ps = puzzleStats.rows[0];
    const totalGames = parseInt(gs.total_games) || 0;
    const wins = parseInt(gs.wins) || 0;
    const draws = parseInt(gs.draws) || 0;

    const analytics = {
      games: {
        total: totalGames,
        wins,
        draws,
        losses: totalGames - wins - draws,
        winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
        avgDurationMinutes: gs.avg_game_minutes || 0,
      },
      ratingHistory: ratingHistory.rows,
      topOpenings: openings.rows,
      puzzles: {
        total: parseInt(ps.total_puzzles) || 0,
        correct: parseInt(ps.correct_puzzles) || 0,
        accuracy: ps.total_puzzles > 0
          ? Math.round((ps.correct_puzzles / ps.total_puzzles) * 100) : 0,
        avgTimeSec: ps.avg_time_ms ? Math.round(ps.avg_time_ms / 1000) : 0,
      },
    };

    await cache.set(cacheKey, analytics, 600);
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

// GET /api/analytics/global (super admin)
router.get('/global', authorize('super_admin'), async (req, res) => {
  try {
    const cached = await cache.get('analytics:global');
    if (cached) return res.json(cached);

    const [academies, users, games, revenue] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM academies'),
      query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE role = 'student') as students, COUNT(*) FILTER (WHERE role = 'coach') as coaches FROM users WHERE is_active"),
      query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as today, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as this_week FROM games"),
      query("SELECT COALESCE(SUM(amount), 0) as total, COALESCE(SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) as this_month FROM invoices WHERE status = 'paid'"),
    ]);

    const data = {
      academies: { total: parseInt(academies.rows[0].total), active: parseInt(academies.rows[0].active) },
      users: { total: parseInt(users.rows[0].total), students: parseInt(users.rows[0].students), coaches: parseInt(users.rows[0].coaches) },
      games: { total: parseInt(games.rows[0].total), today: parseInt(games.rows[0].today), thisWeek: parseInt(games.rows[0].this_week) },
      revenue: { total: parseFloat(revenue.rows[0].total), thisMonth: parseFloat(revenue.rows[0].this_month) },
    };

    await cache.set('analytics:global', data, 300);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get global analytics' });
  }
});

// GET /api/analytics/academies/:academyId
router.get('/academies/:academyId', async (req, res) => {
  try {
    const { academyId } = req.params;
    if (req.user.role !== 'super_admin' && req.user.academyId !== academyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [studentPerf, classroomStats, topStudents] = await Promise.all([
      query(
        `SELECT
           AVG(u.rating) as avg_rating,
           MAX(u.rating) as max_rating,
           MIN(u.rating) as min_rating
         FROM users u
         WHERE u.academy_id = $1 AND u.role = 'student' AND u.is_active`,
        [academyId]
      ),
      query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) FILTER (WHERE status = 'completed') as avg_duration_min
         FROM classrooms WHERE academy_id = $1`,
        [academyId]
      ),
      query(
        `SELECT u.name, u.rating, u.avatar
         FROM users u
         WHERE u.academy_id = $1 AND u.role = 'student' AND u.is_active
         ORDER BY u.rating DESC LIMIT 10`,
        [academyId]
      ),
    ]);

    res.json({
      studentPerformance: studentPerf.rows[0],
      classrooms: classroomStats.rows[0],
      topStudents: topStudents.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get academy analytics' });
  }
});

module.exports = router;

// ─── GET /api/analytics/coaches/:academyId — Coach performance report ──────────
router.get('/coaches/:academyId', authorize('academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { academyId } = req.params;
    const { period = '30d' } = req.query;
    const intervalMap = { '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' };
    const interval = intervalMap[period] || '30 days';

    const coachStats = await query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.rating,
        -- Classes taught
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed' AND c.created_at > NOW() - INTERVAL '${interval}')
          AS classes_completed,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'scheduled' AND c.scheduled_at > NOW())
          AS classes_upcoming,
        -- Total hours taught
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (c.ended_at - c.started_at)) / 3600
        ) FILTER (WHERE c.status = 'completed' AND c.started_at IS NOT NULL AND c.ended_at IS NOT NULL
          AND c.created_at > NOW() - INTERVAL '${interval}'), 0)::NUMERIC(6,1) AS hours_taught,
        -- Unique students taught
        COUNT(DISTINCT b.id) FILTER (WHERE c.status = 'completed') AS batches_count,
        -- Assignments created and graded
        COUNT(DISTINCT a.id) FILTER (WHERE a.created_at > NOW() - INTERVAL '${interval}')
          AS assignments_created,
        COUNT(DISTINCT asub.id) FILTER (WHERE asub.graded_at IS NOT NULL AND asub.graded_at > NOW() - INTERVAL '${interval}')
          AS submissions_graded,
        -- Avg attendance rate
        CASE WHEN COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') > 0
          THEN ROUND(
            100.0 * COUNT(DISTINCT ca.user_id) FILTER (WHERE ca.attended = true) /
            NULLIF(COUNT(DISTINCT ca.user_id), 0)
          )
          ELSE NULL
        END AS avg_attendance_pct
       FROM users u
       LEFT JOIN classrooms c ON c.coach_id = u.id AND c.academy_id = $1
       LEFT JOIN batches b ON b.coach_id = u.id AND b.academy_id = $1
       LEFT JOIN assignments a ON a.coach_id = u.id
       LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
       LEFT JOIN classroom_attendance ca ON ca.classroom_id = c.id
       WHERE u.academy_id = $1 AND u.role = 'coach' AND u.is_active = true
       GROUP BY u.id, u.name, u.email, u.avatar, u.rating
       ORDER BY hours_taught DESC, classes_completed DESC`,
      [academyId]
    );

    // For each coach: student improvement (avg rating change for students in their batches)
    const improvements = await query(
      `SELECT
        b.coach_id,
        ROUND(AVG(u.rating - COALESCE(rh.prev_rating, u.rating))) AS avg_student_improvement
       FROM batches b
       JOIN batch_enrollments be ON be.batch_id = b.id
       JOIN users u ON u.id = be.student_id
       LEFT JOIN (
         SELECT user_id, rating AS prev_rating
         FROM rating_history
         WHERE recorded_at < NOW() - INTERVAL '${interval}'
         ORDER BY recorded_at DESC
       ) rh ON rh.user_id = u.id
       WHERE b.academy_id = $1
       GROUP BY b.coach_id`,
      [academyId]
    );

    const impMap = {};
    improvements.rows.forEach((r) => { impMap[r.coach_id] = parseInt(r.avg_student_improvement) || 0; });

    const coaches = coachStats.rows.map((c) => ({
      ...c,
      hours_taught: parseFloat(c.hours_taught) || 0,
      classes_completed: parseInt(c.classes_completed) || 0,
      classes_upcoming: parseInt(c.classes_upcoming) || 0,
      assignments_created: parseInt(c.assignments_created) || 0,
      submissions_graded: parseInt(c.submissions_graded) || 0,
      batches_count: parseInt(c.batches_count) || 0,
      avg_attendance_pct: c.avg_attendance_pct ? parseInt(c.avg_attendance_pct) : null,
      avg_student_improvement: impMap[c.id] || 0,
    }));

    // Academy-level summary
    const summary = {
      total_coaches: coaches.length,
      total_hours: coaches.reduce((s, c) => s + c.hours_taught, 0),
      total_classes: coaches.reduce((s, c) => s + c.classes_completed, 0),
      avg_attendance: coaches.filter((c) => c.avg_attendance_pct !== null).length > 0
        ? Math.round(coaches.filter((c) => c.avg_attendance_pct !== null)
          .reduce((s, c) => s + c.avg_attendance_pct, 0) /
          coaches.filter((c) => c.avg_attendance_pct !== null).length)
        : null,
    };

    res.json({ coaches, summary, period });
  } catch (e) {
    console.error('[coach analytics]', e);
    res.status(500).json({ message: 'Failed to get coach analytics' });
  }
});