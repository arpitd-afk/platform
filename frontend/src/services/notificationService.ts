import { query } from '../lib/db';

export class NotificationService {
  static async listNotifications(userId: string, params: { page?: number, limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async getUnreadCount(userId: string) {
    const result = await query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false', [userId]);
    return parseInt(result.rows[0].count);
  }

  static async markAsRead(notificationId: string, userId: string) {
    await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [notificationId, userId]);
  }

  static async markAllAsRead(userId: string) {
    await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [userId]);
  }

  static async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }) {
    const { userId, type, title, body, data: meta } = data;
    await query(
      'INSERT INTO notifications (id, user_id, type, title, body, data, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())',
      [userId, type, title, body, meta ? JSON.stringify(meta) : null]
    );
  }
}

export default NotificationService;
