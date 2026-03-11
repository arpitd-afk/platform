const express = require('express');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { generateStudentReportPDF } = require('../utils/pdfGenerator');

const router = express.Router();
router.use(authenticate);

// GET /api/student-reports/:studentId/data — JSON stats for frontend preview
router.get('/:studentId/data', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { periodDays = 90 } = req.query;
        const since = `NOW() - INTERVAL '${parseInt(periodDays)} days'`;

        // Verify access
        if (req.user.role === 'student' && req.user.id !== studentId)
            return res.status(403).json({ message: 'Forbidden' });

        // Student info
        const stRes = await query('SELECT id,name,email,phone,rating,created_at,avatar FROM users WHERE id=$1', [studentId]);
        if (!stRes.rows.length) return res.status(404).json({ message: 'Student not found' });
        const student = stRes.rows[0];

        // Academy info
        const acRes = await query('SELECT id,name,logo_url,settings FROM academies WHERE id=$1', [req.user.academyId]);
        const academy = acRes.rows[0] || {};

        // Game stats
        const gameRes = await query(
            `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE (result->>'winner'='white' AND white_player_id=$1) OR (result->>'winner'='black' AND black_player_id=$1)) as wins,
         COUNT(*) FILTER (WHERE (result->>'winner'='white' AND black_player_id=$1) OR (result->>'winner'='black' AND white_player_id=$1)) as losses,
         COUNT(*) FILTER (WHERE status='completed' AND result->>'winner' IS NULL) as draws
       FROM games WHERE (white_player_id=$1 OR black_player_id=$1) AND created_at > ${since}`,
            [studentId]
        );
        const gs = gameRes.rows[0];
        const gamesPlayed = parseInt(gs.total);
        const wins = parseInt(gs.wins), losses = parseInt(gs.losses);
        const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

        // Rating history
        const ratingRes = await query(
            `SELECT rating, recorded_at FROM rating_history
       WHERE user_id=$1 AND recorded_at > ${since} ORDER BY recorded_at ASC LIMIT 30`,
            [studentId]
        );

        // Recent games
        const recentRes = await query(
            `SELECT g.id, g.result, g.status, g.white_player_id, g.black_player_id,
         g.white_rating_change, g.black_rating_change, g.created_at, g.time_control,
         wu.name as white_name, bu.name as black_name
       FROM games g
       LEFT JOIN users wu ON wu.id = g.white_player_id
       LEFT JOIN users bu ON bu.id = g.black_player_id
       WHERE (g.white_player_id=$1 OR g.black_player_id=$1) AND g.status='completed'
       ORDER BY g.created_at DESC LIMIT 6`,
            [studentId]
        );

        // Puzzle stats
        const puzzleRes = await query(
            `SELECT
         COUNT(*) as attempted,
         COUNT(*) FILTER (WHERE is_correct=true) as solved,
         AVG(time_taken_ms) FILTER (WHERE is_correct=true) as avg_time
       FROM puzzle_attempts WHERE user_id=$1 AND attempted_at > ${since}`,
            [studentId]
        );
        const ps = puzzleRes.rows[0];
        const attempted = parseInt(ps.attempted), solved = parseInt(ps.solved);

        // Attendance
        const attRes = await query(
            `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE ca.status='present') as present,
         COUNT(*) FILTER (WHERE ca.status='absent') as absent
       FROM classroom_attendance ca
       JOIN classrooms c ON c.id = ca.classroom_id
       WHERE ca.student_id=$1 AND ca.date > ${since}`,
            [studentId]
        );
        const att = attRes.rows[0];
        const attTotal = parseInt(att.total);
        const attPresent = parseInt(att.present);

        res.json({
            student,
            academy,
            period: `Last ${periodDays} days`,
            stats: { gamesPlayed, wins, losses, draws: parseInt(gs.draws), winRate },
            ratingHistory: ratingRes.rows,
            recentGames: recentRes.rows,
            puzzleStats: {
                attempted, solved,
                accuracy: attempted > 0 ? Math.round((solved / attempted) * 100) : 0,
                avgTime: ps.avg_time ? Math.round(ps.avg_time) : null,
            },
            attendanceSummary: {
                total: attTotal, present: attPresent, absent: parseInt(att.absent),
                rate: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0,
            },
        });
    } catch (e) { console.error('[student-reports]', e.message); res.status(500).json({ message: 'Failed' }); }
});

// GET /api/student-reports/:studentId/pdf — download PDF
router.get('/:studentId/pdf', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { periodDays = 90 } = req.query;

        if (req.user.role === 'student' && req.user.id !== studentId)
            return res.status(403).json({ message: 'Forbidden' });

        // Reuse data endpoint logic inline
        const since = `NOW() - INTERVAL '${parseInt(periodDays)} days'`;

        const stRes = await query('SELECT id,name,email,phone,rating,created_at FROM users WHERE id=$1', [studentId]);
        if (!stRes.rows.length) return res.status(404).json({ message: 'Student not found' });
        const student = stRes.rows[0];

        const acRes = await query('SELECT name,logo_url,settings FROM academies WHERE id=$1', [req.user.academyId]);
        const academy = acRes.rows[0] || {};

        const gameRes = await query(
            `SELECT COUNT(*) as total,
         COUNT(*) FILTER (WHERE (result->>'winner'='white' AND white_player_id=$1) OR (result->>'winner'='black' AND black_player_id=$1)) as wins,
         COUNT(*) FILTER (WHERE (result->>'winner'='white' AND black_player_id=$1) OR (result->>'winner'='black' AND white_player_id=$1)) as losses,
         COUNT(*) FILTER (WHERE status='completed' AND result->>'winner' IS NULL) as draws
       FROM games WHERE (white_player_id=$1 OR black_player_id=$1) AND created_at > ${since}`,
            [studentId]
        );
        const gs = gameRes.rows[0];
        const gamesPlayed = parseInt(gs.total), wins = parseInt(gs.wins), losses = parseInt(gs.losses);

        const ratingRes = await query(
            `SELECT rating, recorded_at FROM rating_history WHERE user_id=$1 AND recorded_at > ${since} ORDER BY recorded_at ASC LIMIT 30`,
            [studentId]
        );
        const recentRes = await query(
            `SELECT g.id,g.result,g.status,g.white_player_id,g.black_player_id,
         g.white_rating_change,g.black_rating_change,g.created_at,
         wu.name as white_name, bu.name as black_name
       FROM games g LEFT JOIN users wu ON wu.id=g.white_player_id LEFT JOIN users bu ON bu.id=g.black_player_id
       WHERE (g.white_player_id=$1 OR g.black_player_id=$1) AND g.status='completed'
       ORDER BY g.created_at DESC LIMIT 6`,
            [studentId]
        );
        const puzzleRes = await query(
            `SELECT COUNT(*) as attempted, COUNT(*) FILTER (WHERE is_correct=true) as solved, AVG(time_taken_ms) FILTER (WHERE is_correct=true) as avg_time
       FROM puzzle_attempts WHERE user_id=$1 AND attempted_at > ${since}`,
            [studentId]
        );
        const ps = puzzleRes.rows[0];
        const attRes = await query(
            `SELECT COUNT(*) as total,
         COUNT(*) FILTER (WHERE ca.status='present') as present,
         COUNT(*) FILTER (WHERE ca.status='absent') as absent
       FROM classroom_attendance ca JOIN classrooms c ON c.id=ca.classroom_id
       WHERE ca.student_id=$1 AND ca.date > ${since}`,
            [studentId]
        );
        const att = attRes.rows[0];
        const attTotal = parseInt(att.total), attPresent = parseInt(att.present);
        const pAttempted = parseInt(ps.attempted), pSolved = parseInt(ps.solved);

        const data = {
            student, academy,
            period: `Last ${periodDays} days`,
            stats: { gamesPlayed, wins, losses, draws: parseInt(gs.draws), winRate: gamesPlayed > 0 ? Math.round(wins / gamesPlayed * 100) : 0 },
            ratingHistory: ratingRes.rows,
            recentGames: recentRes.rows,
            puzzleStats: { attempted: pAttempted, solved: pSolved, accuracy: pAttempted > 0 ? Math.round(pSolved / pAttempted * 100) : 0, avgTime: ps.avg_time ? Math.round(ps.avg_time) : null },
            attendanceSummary: { total: attTotal, present: attPresent, absent: parseInt(att.absent), rate: attTotal > 0 ? Math.round(attPresent / attTotal * 100) : 0 },
        };

        const pdfBuffer = await generateStudentReportPDF(data);
        const safeName = (student.name || 'student').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report_${safeName}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (e) { console.error('[student-report-pdf]', e.message); res.status(500).json({ message: 'Failed to generate report' }); }
});

module.exports = router;