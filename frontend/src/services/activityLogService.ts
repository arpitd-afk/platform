import { query } from "../lib/db";
import logger from "../lib/logger";

export interface ActivityLogOptions {
  actorId: string;
  actorName: string | null;
  actorRole: string | null;
  academyId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  ip?: string;
}

export class ActivityLogService {
  static async logActivity({
    actorId,
    actorName,
    actorRole,
    academyId,
    action,
    entityType,
    entityId,
    metadata = {},
    ip,
  }: ActivityLogOptions) {
    try {
      await query(
        `INSERT INTO activity_logs (actor_id, actor_name, actor_role, academy_id, action, entity_type, entity_id, metadata, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          actorId,
          actorName,
          actorRole,
          academyId,
          action,
          entityType,
          entityId,
          metadata,
          ip,
        ],
      );
    } catch (err: any) {
      logger.error("Failed to log activity:", err.message);
    }
  }

  static async listLogs(params: {
    userId?: string;
    academyId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, academyId, action, limit = 50, offset = 0 } = params;
    const conditions = [];
    const queryParams = [];

    if (userId) {
      queryParams.push(userId);
      conditions.push(`actor_id = $${queryParams.length}`);
    }
    if (academyId) {
      queryParams.push(academyId);
      conditions.push(`academy_id = $${queryParams.length}`);
    }
    if (action) {
      queryParams.push(action);
      conditions.push(`action = $${queryParams.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    queryParams.push(limit, offset);

    const result = await query(
      `SELECT al.*, a.name as academy_name 
       FROM activity_logs al 
       LEFT JOIN academies a ON al.academy_id = a.id
       ${where
         .replace(/actor_id/g, "al.actor_id")
         .replace(/academy_id/g, "al.academy_id")
         .replace(/action/g, "al.action")} 
       ORDER BY al.created_at DESC 
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams,
    );
    return result.rows;
  }
}

export default ActivityLogService;
