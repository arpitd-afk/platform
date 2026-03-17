import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db';

export class AnnouncementService {
  static async listAnnouncements(params: { academyId: string, userId: string, role: string, limit?: number }) {
    const { academyId, userId, role, limit = 20 } = params;
    const result = await query(
      `SELECT a.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE (a.academy_id = $1 OR (a.academy_id IS NULL AND a.author_id = $2))
         AND (a.target_role IS NULL OR a.target_role = $3)
       ORDER BY a.is_pinned DESC, a.created_at DESC
       LIMIT $4`,
      [academyId, userId, role, limit]
    );
    return result.rows;
  }

  static async listAllAnnouncements(academyId: string, userId: string) {
    const result = await query(
      `SELECT a.*, u.name as author_name, u.avatar as author_avatar,
        (SELECT COUNT(*) FROM users WHERE academy_id = a.academy_id
          AND (a.target_role IS NULL OR role = a.target_role)) as reach
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE (a.academy_id = $1 OR (a.academy_id IS NULL AND a.author_id = $2))
       ORDER BY a.is_pinned DESC, a.created_at DESC`,
      [academyId, userId]
    );
    return result.rows;
  }

  static async createAnnouncement(data: any, currentUser: any) {
    const { title, body, targetRole = null, isPinned = false } = data;
    const id = uuidv4();
    await query(
      `INSERT INTO announcements (id, academy_id, author_id, title, body, target_role, is_pinned, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, currentUser.academyId, currentUser.id, title, body, targetRole || null, isPinned]
    );

    // Notifications
    try {
      const audience = await query(
        `SELECT id FROM users
         WHERE academy_id=$1 AND is_active=true
           AND (${targetRole ? 'role=$2' : '$2::text IS NULL'})`,
        [currentUser.academyId, targetRole]
      );
      for (const u of audience.rows) {
        await query(
          "INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, 'system', $2, $3, NOW())",
          [u.id, `New Announcement: ${title}`, body.slice(0, 100) + (body.length > 100 ? '...' : '')]
        );
      }
    } catch (err: any) {
      console.error('[Announcements Notif Error]', err.message);
    }

    return id;
  }

  static async updateAnnouncement(id: string, data: any, academyId: string) {
    const { title, body, targetRole, isPinned } = data;
    await query(
      `UPDATE announcements SET
         title       = COALESCE($1, title),
         body        = COALESCE($2, body),
         target_role = $3,
         is_pinned   = COALESCE($4, is_pinned)
       WHERE id=$5 AND academy_id=$6`,
      [title, body, targetRole ?? null, isPinned, id, academyId]
    );
  }

  static async deleteAnnouncement(id: string, academyId: string) {
    await query('DELETE FROM announcements WHERE id=$1 AND academy_id=$2', [id, academyId]);
  }

  static async setPinned(id: string, pinned: boolean, academyId: string) {
    await query(
      'UPDATE announcements SET is_pinned=$1 WHERE id=$2 AND academy_id=$3',
      [pinned, id, academyId]
    );
  }
}

export default AnnouncementService;
