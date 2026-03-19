import { prisma } from "../lib/prisma";
import logger from "../lib/logger";
import { ActivityLog } from "../types/models";

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
      await prisma.activityLog.create({
        data: {
          actor_id: actorId,
          actor_name: actorName,
          actor_role: actorRole,
          academy_id: academyId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          metadata,
          ip_address: ip,
        },
      });
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
    
    const where: any = {};
    if (userId) where.actor_id = userId;
    if (academyId) where.academy_id = academyId;
    if (action) where.action = action;

    return prisma.activityLog.findMany({
      where,
      include: {
        academy: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }).then((logs: any[]) => logs.map(l => ({
      ...l,
      academy_name: (l as any).academy?.name,
    })));
  }
}

export default ActivityLogService;
