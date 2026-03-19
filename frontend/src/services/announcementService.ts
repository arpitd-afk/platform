import { prisma } from "../lib/prisma";
import { Announcement } from "@prisma/client";

export class AnnouncementService {
  static async listAnnouncements(params: {
    academyId: string;
    userId: string;
    role: string;
    limit?: number;
  }) {
    const { academyId, userId, role, limit = 20 } = params;

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { academy_id: academyId },
          { academy_id: null, author_id: userId },
        ],
        AND: [
          {
            OR: [{ target_role: null }, { target_role: role }],
          },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: [{ is_pinned: "desc" }, { created_at: "desc" }],
      take: limit,
    });

    return announcements.map(
      (
        a: Announcement & {
          author?: { name: string; avatar: string | null; role: string } | null;
        },
      ) => ({
        ...a,
        author_name: a.author?.name,
        author_avatar: a.author?.avatar,
        author_role: a.author?.role,
      }),
    );
  }

  static async listAllAnnouncements(academyId: string, userId: string) {
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { academy_id: academyId },
          { academy_id: null, author_id: userId },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ is_pinned: "desc" }, { created_at: "desc" }],
    });

    // Reach count: users in academy matching target_role
    return Promise.all(
      announcements.map(
        async (
          a: Announcement & {
            author?: { name: string; avatar: string | null } | null;
          },
        ) => {
          const reach = await prisma.user.count({
            where: {
              academy_id: a.academy_id,
              OR: [
                { role: a.target_role || undefined },
                { id: { not: undefined } }, // placeholder for null target_role
              ],
            },
          });

          // Correcting reach logic for nullable target_role
          const filteredReach = await prisma.user.count({
            where: {
              academy_id: a.academy_id,
              role: a.target_role || undefined,
              is_active: true,
            },
          });

          return {
            ...a,
            author_name: a.author?.name,
            author_avatar: a.author?.avatar,
            reach: a.target_role
              ? filteredReach
              : await prisma.user.count({
                  where: { academy_id: a.academy_id, is_active: true },
                }),
          };
        },
      ),
    );
  }

  static async createAnnouncement(data: any, currentUser: any) {
    const { title, body, targetRole = null, isPinned = false } = data;

    const announcement = await prisma.announcement.create({
      data: {
        academy_id: currentUser.academyId,
        author_id: currentUser.id,
        title,
        body,
        target_role: targetRole,
        is_pinned: isPinned,
      },
    });

    // Notifications
    try {
      const audience = await prisma.user.findMany({
        where: {
          academy_id: currentUser.academyId,
          is_active: true,
          role: targetRole || undefined,
        },
        select: { id: true },
      });

      const notificationsData = audience.map((u: { id: string }) => ({
        user_id: u.id,
        type: "system",
        title: `New Announcement: ${title}`,
        body: body.slice(0, 100) + (body.length > 100 ? "..." : ""),
      }));

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData,
        });
      }
    } catch (err: any) {
      console.error("[Announcements Notif Error]", err.message);
    }

    return announcement.id;
  }

  static async updateAnnouncement(id: string, data: any, academyId: string) {
    const { title, body, targetRole, isPinned } = data;
    await prisma.announcement.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        body: body !== undefined ? body : undefined,
        target_role: targetRole,
        is_pinned: isPinned !== undefined ? isPinned : undefined,
      },
    });
  }

  static async deleteAnnouncement(id: string, academyId: string) {
    await prisma.announcement.delete({
      where: { id },
    });
  }

  static async setPinned(id: string, pinned: boolean, academyId: string) {
    await prisma.announcement.update({
      where: { id },
      data: { is_pinned: pinned },
    });
  }
}

export default AnnouncementService;
