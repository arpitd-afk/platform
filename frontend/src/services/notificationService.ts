import { prisma } from '../lib/prisma';

export class NotificationService {
  static async listNotifications(userId: string, params: { page?: number, limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    
    return prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        user_id: userId,
      },
      data: {
        is_read: true,
      },
    });
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  }

  static async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }) {
    const { userId, type, title, body, data: meta } = data;
    await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        body,
        data: meta || {},
      },
    });
  }
}

export default NotificationService;
