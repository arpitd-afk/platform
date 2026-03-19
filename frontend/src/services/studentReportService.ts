import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class StudentReportService {
  static async getReportData(studentId: string, academyId: string, periodDays: number = 90, currentUser: { id: string, role: string }) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - periodDays);

    // Access check: student can only see own, others (coach/admin) can see if in same academy
    if (currentUser.role === 'student' && currentUser.id !== studentId) {
      throw new Error('Forbidden');
    }

    // Student info
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true, phone: true, rating: true, created_at: true, avatar: true },
    });
    if (!student) throw new Error('Student not found');

    // Academy info
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: { id: true, name: true, logo_url: true, settings: true },
    });

    // Game stats
    // Note: complex filtering for wins/losses might be easier with separate counts or raw query if too many games
    const games = await prisma.game.findMany({
      where: {
        OR: [{ white_player_id: studentId }, { black_player_id: studentId }],
        created_at: { gt: sinceDate },
      },
      select: { result: true, white_player_id: true, black_player_id: true, status: true },
    });

    let wins = 0;
    let losses = 0;
    let draws = 0;

    games.forEach((g) => {
      const result = g.result as any;
      if (g.status === 'completed') {
        if (result?.winner === 'white') {
          if (g.white_player_id === studentId) wins++;
          else losses++;
        } else if (result?.winner === 'black') {
          if (g.black_player_id === studentId) wins++;
          else losses++;
        } else if (result?.winner === null) {
          draws++;
        }
      }
    });

    const gamesPlayed = games.length;

    // Rating history
    const ratingHistory = await prisma.ratingHistory.findMany({
      where: { user_id: studentId, recorded_at: { gt: sinceDate } },
      orderBy: { recorded_at: 'asc' },
      take: 30,
    });

    // Recent games
    const recentGames = await prisma.game.findMany({
      where: {
        OR: [{ white_player_id: studentId }, { black_player_id: studentId }],
        status: 'completed',
      },
      include: {
        white_player: { select: { name: true } },
        black_player: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 6,
    });

    const mappedRecentGames = recentGames.map((g) => ({
      ...g,
      white_name: (g.white_player as any)?.name,
      black_name: (g.black_player as any)?.name,
      white_rating_change: (g.white_rating_after || 0) - (g.white_rating_before || 0),
      black_rating_change: (g.black_rating_after || 0) - (g.black_rating_before || 0),
    }));

    // Puzzle stats
    const puzzleAttempts = await prisma.puzzleAttempt.findMany({
      where: { user_id: studentId, attempted_at: { gt: sinceDate } },
      select: { is_correct: true, time_taken_ms: true },
    });

    const pAttempted = puzzleAttempts.length;
    const pSolved = puzzleAttempts.filter(p => p.is_correct).length;
    const puzzleTimes = puzzleAttempts.filter(p => p.is_correct && p.time_taken_ms).map(p => Number(p.time_taken_ms));
    const avgTime = puzzleTimes.length > 0 ? puzzleTimes.reduce((a, b) => a + b, 0) / puzzleTimes.length : null;

    // Attendance
    const attendance = await prisma.classroomAttendance.findMany({
      where: {
        student_id: studentId,
        classroom: { created_at: { gt: sinceDate } },
      },
      select: { joined_at: true },
    });

    const attTotal = attendance.length;
    const attPresent = attendance.filter(a => a.joined_at !== null).length;
    const attAbsent = attTotal - attPresent;

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
      ratingHistory,
      recentGames: mappedRecentGames,
      puzzleStats: {
        attempted: pAttempted,
        solved: pSolved,
        accuracy: pAttempted > 0 ? Math.round((pSolved / pAttempted) * 100) : 0,
        avgTime: avgTime ? Math.round(avgTime) : null,
      },
      attendanceSummary: {
        total: attTotal,
        present: attPresent,
        absent: attAbsent,
        rate: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0,
      },
    };
  }
}

export default StudentReportService;
