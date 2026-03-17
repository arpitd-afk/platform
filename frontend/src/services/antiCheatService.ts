import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db';
import ActivityLogService from './activityLogService';

export class AntiCheatService {
  static async listReports(params: { status?: string, academyId?: string, role: string }) {
    const { status, academyId, role } = params;
    const conditions = [];
    const queryParams: any[] = [];

    if (status && status !== 'all') {
      queryParams.push(status);
      conditions.push(`cr.status = $${queryParams.length}`);
    }

    if (role === 'academy_admin' && academyId) {
      queryParams.push(academyId);
      conditions.push(`u.academy_id = $${queryParams.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT cr.*, u.name as reported_name, u.rating as reported_rating, u.avatar as reported_avatar,
              g.white_player_id, g.black_player_id, g.time_control,
              reporter.name as reporter_name
       FROM cheat_reports cr
       LEFT JOIN users u ON cr.reported_user = u.id
       LEFT JOIN games g ON cr.game_id = g.id
       LEFT JOIN users reporter ON cr.reporter_id = reporter.id
       ${where}
       ORDER BY cr.created_at DESC LIMIT 100`,
      queryParams
    );
    return result.rows;
  }

  static async reviewReport(reportId: string, data: { status: string, notes?: string }, currentUser: any) {
    const { status, notes } = data;
    if (!['reviewed', 'confirmed', 'dismissed'].includes(status)) {
      throw new Error('Invalid status');
    }

    const report = await query('SELECT * FROM cheat_reports WHERE id=$1', [reportId]);
    if (!report.rows.length) throw new Error('Report not found');

    await query(
      `UPDATE cheat_reports SET status=$1, notes=$2 WHERE id=$3`,
      [status, notes || null, reportId]
    );

    if (status === 'confirmed') {
      await query('UPDATE users SET is_active=false WHERE id=$1', [report.rows[0].reported_user]);
    await ActivityLogService.logActivity({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        academyId: currentUser.academyId,
        action: 'cheater_banned',
        entityType: 'user',
        entityId: report.rows[0].reported_user,
        metadata: { reportId, gameId: report.rows[0].game_id }
      });
    }

    await ActivityLogService.logActivity({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      academyId: currentUser.academyId,
      action: `cheat_report_${status}`,
      entityType: 'cheat_report',
      entityId: reportId,
      metadata: { reportedUser: report.rows[0].reported_user, notes }
    });
  }

  static async createReport(data: any, currentUser: any) {
    const { gameId, reportedUserId, engineSimilarity, suspiciousMoves, notes } = data;
    if (!reportedUserId) throw new Error('reportedUserId is required');

    const id = uuidv4();
    await query(
      `INSERT INTO cheat_reports (id, game_id, reported_user, reporter_id, engine_similarity, suspicious_moves, notes, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())`,
      [id, gameId || null, reportedUserId, currentUser.id, engineSimilarity || null, suspiciousMoves || null, notes || null]
    );

    await ActivityLogService.logActivity({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      academyId: currentUser.academyId,
      action: 'cheat_report_created',
      entityType: 'cheat_report',
      entityId: id,
      metadata: { reportedUserId, gameId }
    });

    // Notify admins
    try {
      const admins = await query("SELECT id FROM users WHERE (academy_id=$1 OR role='super_admin') AND role IN ('academy_admin', 'super_admin')", [currentUser.academyId]);
      const reportedUser = await query('SELECT name FROM users WHERE id=$1', [reportedUserId]);
      const reportedName = reportedUser.rows[0]?.name || 'Unknown User';
      for (const admin of admins.rows) {
        await query(
          "INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, 'system', $2, $3, NOW())",
          [admin.id, 'New Cheat Report', `A cheat report has been filed against ${reportedName}.`]
        );
      }
    } catch (err: any) {
      console.error('[Anticheat Notif Error]', err.message);
    }

    return id;
  }

  static async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status='pending') as pending,
        COUNT(*) FILTER (WHERE status='reviewed') as reviewed,
        COUNT(*) FILTER (WHERE status='confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status='dismissed') as dismissed,
        COUNT(*) as total
      FROM cheat_reports
    `);
    return result.rows[0];
  }
}

export default AntiCheatService;
