import { prisma } from "../lib/prisma";
import { cache } from "../lib/redis";
import { Prisma } from "@prisma/client";

export class AnalyticsService {
  static async getStudentAnalytics(studentId: string, period: string = "30d") {
    const cacheKey = `analytics:student:${studentId}:${period}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const intervalMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    };
    const days = intervalMap[period] || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      gamesCount,
      winsCount,
      drawsCount,
      avgDuration,
      ratingHistory,
      openings,
      puzzleStats,
    ] = await Promise.all([
      prisma.game.count({
        where: {
          OR: [{ white_player_id: studentId }, { black_player_id: studentId }],
          status: "completed",
          created_at: { gte: since },
        },
      }),
      prisma.game.count({
        where: {
          status: "completed",
          created_at: { gte: since },
          OR: [
            {
              white_player_id: studentId,
              result: { path: ["winner"], equals: "white" },
            },
            {
              black_player_id: studentId,
              result: { path: ["winner"], equals: "black" },
            },
          ],
        },
      }),
      prisma.game.count({
        where: {
          status: "completed",
          created_at: { gte: since },
          OR: [{ white_player_id: studentId }, { black_player_id: studentId }],
          result: { path: ["winner"], equals: Prisma.AnyNull },
        },
      }),
      // Prisma doesn't support avg on calculated interval easily, we'll use a rough estimate or skip for now
      // Or we can use raw query for just this part
      prisma.$queryRaw`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60)::INT as avg_min 
                        FROM games WHERE (white_player_id = ${studentId}::uuid OR black_player_id = ${studentId}::uuid) 
                        AND status = 'completed' AND created_at > ${since}` as Promise<
        any[]
      >,
      prisma.ratingHistory.findMany({
        where: { user_id: studentId, recorded_at: { gte: since } },
        orderBy: { recorded_at: "asc" },
        select: { rating: true, recorded_at: true },
      }),
      prisma.$queryRaw`SELECT opening_name, COUNT(*)::INT as games,
                       COUNT(*) FILTER (WHERE (result->>'winner' = 'white' AND white_player_id = ${studentId}::uuid) OR 
                                              (result->>'winner' = 'black' AND black_player_id = ${studentId}::uuid))::INT as wins
                       FROM games
                       WHERE (white_player_id = ${studentId}::uuid OR black_player_id = ${studentId}::uuid)
                       AND opening_name IS NOT NULL AND status = 'completed' AND created_at > ${since}
                       GROUP BY opening_name ORDER BY games DESC LIMIT 10` as Promise<
        any[]
      >,
      prisma.puzzleAttempt.aggregate({
        where: { user_id: studentId, attempted_at: { gte: since } },
        _count: { _all: true },
        _avg: { time_taken_ms: true },
        // is_correct filtering needs separate count or grouping
      }),
    ]);

    const correctPuzzles = await prisma.puzzleAttempt.count({
      where: {
        user_id: studentId,
        attempted_at: { gte: since },
        is_correct: true,
      },
    });

    const analytics = {
      games: {
        total: gamesCount,
        wins: winsCount,
        draws: drawsCount,
        losses: gamesCount - winsCount - drawsCount,
        winRate:
          gamesCount > 0 ? Math.round((winsCount / gamesCount) * 100) : 0,
        avgDurationMinutes: (avgDuration as any)[0]?.avg_min || 0,
      },
      ratingHistory: ratingHistory.map((r) => ({
        rating: r.rating,
        date: r.recorded_at!,
      })),
      topOpenings: openings,
      puzzles: {
        total: puzzleStats._count._all,
        correct: correctPuzzles,
        accuracy:
          puzzleStats._count._all > 0
            ? Math.round((correctPuzzles / puzzleStats._count._all) * 100)
            : 0,
        avgTimeSec: puzzleStats._avg.time_taken_ms
          ? Math.round(puzzleStats._avg.time_taken_ms / 1000)
          : 0,
      },
    };

    await cache.set(cacheKey, analytics, 600);
    return analytics;
  }

  static async getGlobalAnalytics() {
    const cached = await cache.get<any>("analytics:global");
    if (cached) return cached;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [academyStats, userStats, gameStats, revenueStats] =
      await Promise.all([
        prisma.academy.aggregate({
          _count: { _all: true },
          // is_active filter needs separate count or grouping in Prisma aggregate
        }),
        prisma.user.groupBy({
          by: ["role"],
          where: { is_active: true },
          _count: { _all: true },
        }),
        prisma.game.aggregate({
          _count: { _all: true },
        }),
        prisma.invoice.aggregate({
          where: { status: "paid" },
          _sum: { amount: true },
        }),
      ]);

    const activeAcademies = await prisma.academy.count({
      where: { is_active: true },
    });
    const gamesToday = await prisma.game.count({
      where: { created_at: { gte: last24h } },
    });
    const gamesThisWeek = await prisma.game.count({
      where: { created_at: { gte: last7d } },
    });
    const revenueThisMonth = await prisma.invoice.aggregate({
      where: { status: "paid", created_at: { gte: last30d } },
      _sum: { amount: true },
    });

    const userCountMap: any = { student: 0, coach: 0, total: 0 };
    userStats.forEach((s: { role: string; _count: { _all: number } }) => {
      userCountMap.total += s._count._all;
      if (s.role === "student") userCountMap.student = s._count._all;
      if (s.role === "coach") userCountMap.coach = s._count._all;
    });

    const data = {
      academies: { total: academyStats._count._all, active: activeAcademies },
      users: {
        total: userCountMap.total,
        students: userCountMap.student,
        coaches: userCountMap.coach,
      },
      games: {
        total: gameStats._count._all,
        today: gamesToday,
        thisWeek: gamesThisWeek,
      },
      revenue: {
        total: Number(revenueStats._sum.amount || 0),
        thisMonth: Number(revenueThisMonth._sum.amount || 0),
      },
    };

    await cache.set("analytics:global", data, 300);
    return data;
  }

  static async getAcademyAnalytics(academyId: string) {
    const [studentPerf, classroomStats, topStudents] = await Promise.all([
      prisma.user.aggregate({
        where: { academy_id: academyId, role: "student", is_active: true },
        _avg: { rating: true },
        _max: { rating: true },
        _min: { rating: true },
      }),
      prisma.classroom.aggregate({
        where: { academy_id: academyId },
        _count: { _all: true },
        _avg: { duration_min: true },
      }),
      prisma.user.findMany({
        where: { academy_id: academyId, role: "student", is_active: true },
        orderBy: { rating: "desc" },
        take: 10,
        select: { name: true, rating: true, avatar: true },
      }),
    ]);

    const completedClasses = await prisma.classroom.count({
      where: { academy_id: academyId, status: "completed" },
    });

    return {
      studentPerformance: {
        avg_rating: studentPerf._avg.rating,
        max_rating: studentPerf._max.rating,
        min_rating: studentPerf._min.rating,
      },
      classrooms: {
        total: classroomStats._count._all,
        completed: completedClasses,
        avg_duration_min: classroomStats._avg.duration_min,
      },
      topStudents,
    };
  }

  static async getCoachPerformance(academyId: string, period: string = "30d") {
    // This is a very complex query. Let's use raw SQL for it as it's highly optimized already for PG.
    // We'll just wrap it in prisma.$queryRaw.
    const intervalMap: Record<string, string> = {
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
      "1y": "1 year",
    };
    const interval = intervalMap[period] || "30 days";

    const coaches: any[] = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.rating,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed' AND c.created_at > NOW() - ${interval}::interval)
          AS classes_completed,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'scheduled' AND c.scheduled_at > NOW())
          AS classes_upcoming,
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (c.ended_at - c.started_at)) / 3600
        ) FILTER (WHERE c.status = 'completed' AND c.started_at IS NOT NULL AND c.ended_at IS NOT NULL
          AND c.created_at > NOW() - ${interval}::interval), 0)::NUMERIC(6,1) AS hours_taught,
        COUNT(DISTINCT b.id) FILTER (WHERE c.status = 'completed') AS batches_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.created_at > NOW() - ${interval}::interval)
          AS assignments_created,
        COUNT(DISTINCT asub.id) FILTER (WHERE asub.graded_at IS NOT NULL AND asub.graded_at > NOW() - ${interval}::interval)
          AS submissions_graded,
        CASE WHEN COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') > 0
          THEN ROUND(
            100.0 * COUNT(ca.student_id) /
            NULLIF(COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed'), 0)
          )
          ELSE NULL
        END AS avg_attendance_pct
       FROM users u
       LEFT JOIN classrooms c ON c.coach_id = u.id AND c.academy_id = ${academyId}::uuid
       LEFT JOIN batches b ON b.coach_id = u.id AND b.academy_id = ${academyId}::uuid
       LEFT JOIN assignments a ON a.coach_id = u.id
       LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
       LEFT JOIN classroom_attendance ca ON ca.classroom_id = c.id
       WHERE u.academy_id = ${academyId}::uuid AND u.role = 'coach' AND u.is_active = true
       GROUP BY u.id, u.name, u.email, u.avatar, u.rating
       ORDER BY hours_taught DESC, classes_completed DESC
    `;

    const improvements: any[] = await prisma.$queryRaw`
      SELECT
        b.coach_id,
        ROUND(AVG(u.rating - COALESCE(rh.prev_rating, u.rating))) AS avg_student_improvement
       FROM batches b
       JOIN batch_enrollments be ON be.batch_id = b.id AND be.is_active = true
       JOIN users u ON u.id = be.student_id
       LEFT JOIN LATERAL (
         SELECT rating AS prev_rating
         FROM rating_history
         WHERE user_id = u.id AND recorded_at < NOW() - ${interval}::interval
         ORDER BY recorded_at DESC
         LIMIT 1
       ) rh ON true
       WHERE b.academy_id = ${academyId}::uuid
       GROUP BY b.coach_id
    `;

    const impMap: Record<string, number> = {};
    improvements.forEach(
      (r: { coach_id: string; avg_student_improvement: string }) => {
        impMap[r.coach_id] = parseInt(r.avg_student_improvement) || 0;
      },
    );

    const formattedCoaches = coaches.map((c) => ({
      ...c,
      hours_taught: parseFloat(c.hours_taught) || 0,
      classes_completed: parseInt(c.classes_completed) || 0,
      classes_upcoming: parseInt(c.classes_upcoming) || 0,
      assignments_created: parseInt(c.assignments_created) || 0,
      submissions_graded: parseInt(c.submissions_graded) || 0,
      batches_count: parseInt(c.batches_count) || 0,
      avg_attendance_pct: c.avg_attendance_pct
        ? parseInt(c.avg_attendance_pct)
        : null,
      avg_student_improvement: impMap[c.id] || 0,
    }));

    const summary = {
      total_coaches: formattedCoaches.length,
      total_hours: formattedCoaches.reduce((s, c) => s + c.hours_taught, 0),
      total_classes: formattedCoaches.reduce(
        (s, c) => s + c.classes_completed,
        0,
      ),
      avg_attendance:
        formattedCoaches.filter((c) => c.avg_attendance_pct !== null).length > 0
          ? Math.round(
              formattedCoaches
                .filter((c) => c.avg_attendance_pct !== null)
                .reduce((s, c) => s + c.avg_attendance_pct, 0) /
                formattedCoaches.filter((c) => c.avg_attendance_pct !== null)
                  .length,
            )
          : null,
    };

    return { coaches: formattedCoaches, summary, period };
  }
}

export default AnalyticsService;
