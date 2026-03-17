import { query } from '../lib/db';

export class StudentReportService {
  static async getReportData(studentId: string, academyId: string, periodDays: number = 90, currentUser: any) {
    const sinceClause = `NOW() - INTERVAL '${periodDays} days'`;

    // Access check: student can only see own, others (coach/admin) can see if in same academy
    if (currentUser.role === 'student' && currentUser.id !== studentId) {
      throw new Error('Forbidden');
    }

    // Student info
    const stRes = await query('SELECT id,name,email,phone,rating,created_at,avatar FROM users WHERE id=$1', [studentId]);
    if (!stRes.rows.length) throw new Error('Student not found');
    const student = stRes.rows[0];

    // Academy info
    const acRes = await query('SELECT id,name,logo_url,settings FROM academies WHERE id=$1', [academyId]);
    const academy = acRes.rows[0] || {};

    // Game stats
    const gameRes = await query(
      `SELECT COUNT(*) as total,
         COUNT(*) FILTER (WHERE (result->>'winner'='white' AND white_player_id=$1) OR (result->>'winner'='black' AND black_player_id=$1)) as wins,
         COUNT(*) FILTER (WHERE (result->>'winner'='white' AND black_player_id=$1) OR (result->>'winner'='black' AND white_player_id=$1)) as losses,
         COUNT(*) FILTER (WHERE status='completed' AND result->>'winner' IS NULL) as draws
       FROM games WHERE (white_player_id=$1 OR black_player_id=$1) AND created_at > ${sinceClause}`,
      [studentId]
    );
    const gs = gameRes.rows[0];
    const gamesPlayed = parseInt(gs.total) || 0;
    const wins = parseInt(gs.wins) || 0;
    const losses = parseInt(gs.losses) || 0;
    const draws = parseInt(gs.draws) || 0;

    // Rating history
    const ratingRes = await query(
      `SELECT rating, recorded_at FROM rating_history WHERE user_id=$1 AND recorded_at > ${sinceClause} ORDER BY recorded_at ASC LIMIT 30`,
      [studentId]
    );

    // Recent games
    const recentRes = await query(
      `SELECT g.id, g.result, g.status, g.white_player_id, g.black_player_id,
         (g.white_rating_after - g.white_rating_before) as white_rating_change,
         (g.black_rating_after - g.black_rating_before) as black_rating_change,
         g.created_at, g.time_control,
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
      `SELECT COUNT(*) as attempted,
         COUNT(*) FILTER (WHERE is_correct=true) as solved,
         AVG(time_taken_ms) FILTER (WHERE is_correct=true) as avg_time
       FROM puzzle_attempts WHERE user_id=$1 AND attempted_at > ${sinceClause}`,
      [studentId]
    );
    const ps = puzzleRes.rows[0];
    const pAttempted = parseInt(ps.attempted) || 0;
    const pSolved = parseInt(ps.solved) || 0;

    // Attendance
    const attRes = await query(
      `SELECT COUNT(*) as total,
         COUNT(*) FILTER (WHERE ca.joined_at IS NOT NULL) as present,
         COUNT(*) FILTER (WHERE ca.joined_at IS NULL) as absent
       FROM classroom_attendance ca
       JOIN classrooms c ON c.id = ca.classroom_id
       WHERE ca.student_id=$1 AND c.created_at > ${sinceClause}`,
      [studentId]
    );
    const att = attRes.rows[0];
    const attTotal = parseInt(att.total) || 0;
    const attPresent = parseInt(att.present) || 0;

    return {
      student,
      academy,
      period: `Last ${periodDays} days`,
      stats: {
        gamesPlayed,
        wins,
        losses,
        draws,
        winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
      },
      ratingHistory: ratingRes.rows,
      recentGames: recentRes.rows,
      puzzleStats: {
        attempted: pAttempted,
        solved: pSolved,
        accuracy: pAttempted > 0 ? Math.round((pSolved / pAttempted) * 100) : 0,
        avgTime: ps.avg_time ? Math.round(ps.avg_time) : null,
      },
      attendanceSummary: {
        total: attTotal,
        present: attPresent,
        absent: parseInt(att.absent) || 0,
        rate: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0,
      },
    };
  }
}

export default StudentReportService;
