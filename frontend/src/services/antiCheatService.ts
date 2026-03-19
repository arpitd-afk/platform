import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import ActivityLogService from "./activityLogService";

export class AntiCheatService {
  static async listReports(params: {
    status?: string;
    academyId?: string;
    role: string;
  }) {
    const { status, academyId, role } = params;

    const where: Prisma.CheatReportWhereInput = {};
    if (status && status !== "all") {
      where.status = status;
    }

    if (role === "academy_admin" && academyId) {
      where.user = { academy_id: academyId };
    }

    const include = {
      user: {
        select: {
          name: true,
          rating: true,
          avatar: true,
        },
      },
      reporter: {
        select: {
          name: true,
        },
      },
      game: {
        select: {
          white_player_id: true,
          black_player_id: true,
          time_control: true,
        },
      },
    };

    const reports = await prisma.cheatReport.findMany({
      where,
      include,
      orderBy: { created_at: "desc" },
      take: 100,
    });

    return (
      reports as Prisma.CheatReportGetPayload<{ include: typeof include }>[]
    ).map((r) => ({
      ...r,
      reported_name: r.user?.name,
      reported_rating: r.user?.rating,
      reported_avatar: r.user?.avatar,
      reporter_name: r.reporter?.name,
      white_player_id: r.game?.white_player_id,
      black_player_id: r.game?.black_player_id,
      time_control: r.game?.time_control,
    }));
  }

  static async reviewReport(
    reportId: string,
    data: { status: string; notes?: string },
    currentUser: { id: string; name: string; role: string; academyId: string },
  ) {
    const { status, notes } = data;
    if (!["reviewed", "confirmed", "dismissed"].includes(status)) {
      throw new Error("Invalid status");
    }

    const report = await prisma.cheatReport.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new Error("Report not found");

    await prisma.cheatReport.update({
      where: { id: reportId },
      data: { status, notes: notes || null },
    });
    if (status === "confirmed") {
      await prisma.user.update({
        where: { id: report.reported_user || "" },
        data: { is_active: false },
      });

      await ActivityLogService.logActivity({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        academyId: currentUser.academyId,
        action: "cheater_banned",
        entityType: "user",
        entityId: report.reported_user || "",
        metadata: { reportId, gameId: report.game_id },
      });
    }

    await ActivityLogService.logActivity({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      academyId: currentUser.academyId,
      action: `cheat_report_${status}`,
      entityType: "cheat_report",
      entityId: reportId,
      metadata: { reportedUser: report.reported_user, notes },
    });
  }

  static async createReport(
    data: {
      gameId?: string;
      reportedUserId: string;
      engineSimilarity?: number | null;
      suspiciousMoves?: string[];
      notes?: string | null;
    },
    currentUser: { id: string; academyId: string; name: string; role: string },
  ) {
    const { gameId, reportedUserId, engineSimilarity, suspiciousMoves, notes } =
      data;
    if (!reportedUserId) throw new Error("reportedUserId is required");

    const report = await prisma.cheatReport.create({
      data: {
        game_id: gameId || null,
        reported_user: reportedUserId,
        reporter_id: currentUser.id,
        engine_similarity: engineSimilarity || null,
        suspicious_moves: suspiciousMoves || [],
        notes: notes || null,
        status: "pending",
      },
    });

    await ActivityLogService.logActivity({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      academyId: currentUser.academyId,
      action: "cheat_report_created",
      entityType: "cheat_report",
      entityId: report.id,
      metadata: { reportedUserId, gameId },
    });

    // Notify admins
    try {
      const admins = await prisma.user.findMany({
        where: {
          OR: [
            {
              academy_id: currentUser.academyId,
              role: { in: ["academy_admin", "super_admin"] },
            },
            { role: "super_admin" },
          ],
        },
        select: { id: true },
      });

      const reportedUser = await prisma.user.findUnique({
        where: { id: reportedUserId },
        select: { name: true },
      });
      const reportedName = reportedUser?.name || "Unknown User";

      const notificationsData = admins.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: "system",
        title: "New Cheat Report",
        body: `A cheat report has been filed against ${reportedName}.`,
      }));

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData,
        });
      }
    } catch (err: unknown) {
      console.error("[Anticheat Notif Error]", (err as Error).message);
    }

    return report.id;
  }

  static async getStats() {
    const counts = await prisma.cheatReport.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const stats: Record<string, number> = {
      pending: 0,
      reviewed: 0,
      confirmed: 0,
      dismissed: 0,
      total: 0,
    };

    counts.forEach((c: { status: string | null; _count: { _all: number } }) => {
      if (c.status && c.status in stats) {
        stats[c.status] = c._count._all;
      }
      stats.total += c._count._all;
    });

    return stats;
  }
}

export default AntiCheatService;
