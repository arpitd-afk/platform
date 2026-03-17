import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db';

export class MessagingService {
  static async listBatchMessages(batchId: string, params: { limit?: number, before?: string }, currentUser: any) {
    const { limit = 60, before } = params;
    
    // Auth check
    const access = await query(
      `SELECT 1 FROM batches b
       LEFT JOIN batch_enrollments be ON be.batch_id = b.id AND be.student_id = $1
       WHERE b.id = $2 AND (b.coach_id = $1 OR be.student_id = $1 OR $3 IN ('academy_admin','super_admin'))
       LIMIT 1`,
      [currentUser.id, batchId, currentUser.role]
    );
    if (!access.rows.length) throw new Error('Forbidden');

    const queryParams: any[] = [batchId, limit];
    let beforeClause = '';
    if (before) {
      queryParams.push(before);
      beforeClause = ` AND bm.created_at < $3`;
    }

    const result = await query(
      `SELECT bm.id, bm.batch_id, bm.content, bm.created_at,
        bm.sender_id, u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar
       FROM batch_messages bm
       JOIN users u ON u.id = bm.sender_id
       WHERE bm.batch_id = $1${beforeClause}
       ORDER BY bm.created_at ASC
       LIMIT $2`,
      queryParams
    );
    return result.rows;
  }

  static async sendBatchMessage(batchId: string, content: string, currentUser: any) {
    const access = await query(
      `SELECT 1 FROM batches b
       LEFT JOIN batch_enrollments be ON be.batch_id = b.id AND be.student_id = $1
       WHERE b.id = $2 AND (b.coach_id = $1 OR be.student_id = $1 OR $3 IN ('academy_admin','super_admin'))
       LIMIT 1`,
      [currentUser.id, batchId, currentUser.role]
    );
    if (!access.rows.length) throw new Error('Forbidden');

    const id = uuidv4();
    await query(
      'INSERT INTO batch_messages (id, batch_id, sender_id, content, created_at) VALUES ($1,$2,$3,$4,NOW())',
      [id, batchId, currentUser.id, content.trim()]
    );
    return id;
  }

  static async deleteBatchMessage(msgId: string, userId: string) {
    const result = await query(
      'DELETE FROM batch_messages WHERE id=$1 AND sender_id=$2 RETURNING id, batch_id',
      [msgId, userId]
    );
    if (!result.rows.length) throw new Error('Not found or not yours');
    return result.rows[0];
  }

  static async listConversations(userId: string) {
    const result = await query(
      `SELECT
        other_user,
        u.name as other_name, u.role as other_role, u.avatar as other_avatar,
        last_message, last_at, last_sender_id,
        COUNT(unread.id) as unread_count
       FROM (
         SELECT DISTINCT ON (CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END)
           CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END as other_user,
           content as last_message, created_at as last_at, sender_id as last_sender_id
         FROM messages
         WHERE sender_id=$1 OR receiver_id=$1
         ORDER BY other_user, created_at DESC
       ) conv
       JOIN users u ON u.id = conv.other_user
       LEFT JOIN messages unread ON unread.sender_id = conv.other_user
         AND unread.receiver_id = $1 AND unread.is_read = false
       GROUP BY other_user, u.name, u.role, u.avatar, last_message, last_at, last_sender_id
       ORDER BY last_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async listDirectMessages(userId: string, otherUserId: string, limit: number = 50) {
    const result = await query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id=$1 AND m.receiver_id=$2) OR (m.sender_id=$2 AND m.receiver_id=$1)
       ORDER BY m.created_at ASC LIMIT $3`,
      [userId, otherUserId, limit]
    );
    // Mark as read
    await query(
      'UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2 AND is_read=false',
      [otherUserId, userId]
    );
    return result.rows;
  }

  static async sendDirectMessage(senderId: string, receiverId: string, content: string) {
    const id = uuidv4();
    await query(
      'INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at) VALUES ($1,$2,$3,$4,false,NOW())',
      [id, senderId, receiverId, content.trim()]
    );
    return id;
  }

  static async listContacts(currentUser: any) {
    let roleFilter: string[] = [];
    const role = currentUser.role;
    if (role === 'student') roleFilter = ['coach', 'academy_admin'];
    else if (role === 'coach') roleFilter = ['student', 'academy_admin'];
    else if (role === 'parent') roleFilter = ['coach', 'academy_admin'];
    else if (role === 'academy_admin') roleFilter = ['coach', 'student', 'parent'];
    else roleFilter = ['academy_admin', 'coach', 'student', 'parent', 'super_admin'];

    const result = await query(
      `SELECT id, name, email, role, avatar FROM users
       WHERE role = ANY($1::text[]) AND academy_id = $2 AND is_active = true AND id != $3
       ORDER BY name ASC LIMIT 100`,
      [roleFilter, currentUser.academyId, currentUser.id]
    );
    return result.rows;
  }

  static async getUnreadCount(userId: string) {
    const result = await query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id=$1 AND is_read=false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  static async markAsRead(userId: string, otherUserId: string) {
    await query(
      'UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2 AND is_read=false',
      [otherUserId, userId]
    );
  }

  static async deleteMessage(msgId: string, userId: string) {
    const result = await query(
      'DELETE FROM messages WHERE id=$1 AND sender_id=$2 RETURNING id, receiver_id',
      [msgId, userId]
    );
    if (!result.rows.length) throw new Error('Not found or not yours');
    return result.rows[0];
  }
}

export default MessagingService;
