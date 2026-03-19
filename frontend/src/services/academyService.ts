import { prisma } from '../lib/prisma';
import { Academy } from '@prisma/client';
import { cache as redis } from '../lib/redis';
import ActivityLogService from './activityLogService';
import bcrypt from 'bcryptjs';

export class AcademyService {
  static async listAcademies(params: { page?: number, limit?: number, search?: string, plan?: string, status?: string }) {
    const { page = 1, limit = 20, search, plan, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan) {
      where.plan = plan;
    }
    if (status === 'active') where.is_active = true;
    if (status === 'inactive') where.is_active = false;

    const [academies, total] = await Promise.all([
      prisma.academy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              users: true, // We need to filter this by role in the mapping or use separate counts
            },
          },
        },
      }),
      prisma.academy.count({ where }),
    ]);

    // Prisma doesn't support filtered counts in include easily for list, 
    // so we'll fetch student/coach counts separately or accept the overhead of subqueries
    const academiesWithCounts = await Promise.all(academies.map(async (a: Academy) => {
      const [studentCount, coachCount, owner] = await Promise.all([
        prisma.user.count({ where: { academy_id: a.id, role: 'student' } }),
        prisma.user.count({ where: { academy_id: a.id, role: 'coach' } }),
        a.owner_id ? prisma.user.findUnique({ where: { id: a.owner_id }, select: { name: true, email: true } }) : Promise.resolve(null),
      ]);

      return {
        ...a,
        owner_name: owner?.name,
        owner_email: owner?.email,
        student_count: studentCount,
        coach_count: coachCount,
      };
    }));

    return {
      academies: academiesWithCounts,
      total,
      page,
      limit,
    };
  }

  static async getById(id: string) {
    const cacheKey = `academy:${id}`;
    const cached = await redis.get<any>(cacheKey);
    if (cached) return cached;

    const academy = await prisma.academy.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            batches: true,
          },
        },
      },
    });

    if (!academy) return null;

    // Get specific counts
    const [studentCount, coachCount, batchCount, owner] = await Promise.all([
      prisma.user.count({ where: { academy_id: id, role: 'student', is_active: true } }),
      prisma.user.count({ where: { academy_id: id, role: 'coach', is_active: true } }),
      prisma.batch.count({ where: { academy_id: id, is_active: true } }),
      academy.owner_id ? prisma.user.findUnique({ where: { id: academy.owner_id }, select: { name: true, email: true } }) : Promise.resolve(null),
    ]);

    const result = {
      ...academy,
      owner_name: owner?.name,
      owner_email: owner?.email,
      student_count: studentCount,
      coach_count: coachCount,
      batch_count: batchCount,
    };

    await redis.set(cacheKey, result, 300);
    return result;
  }

  static async createAcademy(data: any, currentUser?: any) {
    const { name, subdomain, ownerEmail, ownerName, ownerPassword, plan } = data;

    const existingSub = await prisma.academy.findUnique({ where: { subdomain } });
    if (existingSub) throw new Error('Subdomain already taken');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const academy = await prisma.academy.create({
      data: {
        name,
        subdomain,
        plan,
        is_active: true,
        trial_ends_at: trialEndsAt,
      },
    });

    let ownerId = null;
    if (ownerEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
      if (existingUser) {
        ownerId = existingUser.id;
        await prisma.user.update({
          where: { id: ownerId },
          data: { academy_id: academy.id, role: 'academy_admin' },
        });
      } else if (ownerName) {
        const hash = await bcrypt.hash(ownerPassword || 'Admin@123', 10);
        const newUser = await prisma.user.create({
          data: {
            name: ownerName,
            email: ownerEmail,
            password_hash: hash,
            role: 'academy_admin',
            academy_id: academy.id,
            is_active: true,
          },
        });
        ownerId = newUser.id;
      }

      if (ownerId) {
        await prisma.academy.update({
          where: { id: academy.id },
          data: { owner_id: ownerId },
        });
      }
    }

    if (currentUser) {
      await ActivityLogService.logActivity({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        academyId: academy.id,
        action: 'academy_created',
        entityType: 'academy',
        entityId: academy.id,
        metadata: { name, subdomain, plan }
      });
    } else {
      await ActivityLogService.logActivity({
        actorId: ownerId || 'system',
        actorName: ownerName || 'Public Registration',
        actorRole: 'academy_admin',
        academyId: academy.id,
        action: 'academy_registered',
        entityType: 'academy',
        entityId: academy.id,
        metadata: { name, subdomain, plan, ownerEmail }
      });
    }

    return { academyId: academy.id, ownerId };
  }

  static async updateAcademy(id: string, data: any) {
    const { name, settings, theme, plan } = data;
    const updateData: any = { updated_at: new Date() };
    if (name !== undefined) updateData.name = name;
    if (settings !== undefined) updateData.settings = settings;
    if (theme !== undefined) updateData.theme = theme;
    if (plan !== undefined) updateData.plan = plan;
    
    await prisma.academy.update({
      where: { id },
      data: updateData,
    });

    await redis.del(`academy:${id}`);
  }

  static async setStatus(id: string, active: boolean, currentUser: any) {
    await prisma.academy.update({
      where: { id },
      data: { is_active: active, updated_at: new Date() },
    });
    await redis.del(`academy:${id}`);
    
    await ActivityLogService.logActivity({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      academyId: id,
      action: active ? 'academy_activated' : 'academy_suspended',
      entityType: 'academy',
      entityId: id
    });
  }

  static async getStats(id: string) {
    const cacheKey = `academy:${id}:stats`;
    const cached = await redis.get<any>(cacheKey);
    if (cached) return cached;

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [students, coaches, games, tournaments, classrooms] = await Promise.all([
      prisma.user.count({ where: { academy_id: id, role: 'student', is_active: true } }),
      prisma.user.count({ where: { academy_id: id, role: 'coach', is_active: true } }),
      prisma.game.count({
        where: {
          OR: [
            { white_player: { academy_id: id } },
            { black_player: { academy_id: id } },
          ],
          created_at: { gte: monthAgo },
        },
      }),
      prisma.tournament.count({ where: { academy_id: id } }),
      prisma.classroom.count({
        where: { academy_id: id, status: 'completed', created_at: { gte: monthAgo } },
      }),
    ]);

    const stats = {
      students,
      coaches,
      gamesThisMonth: games,
      tournaments,
      classroomsThisMonth: classrooms,
    };

    await redis.set(cacheKey, stats, 600);
    return stats;
  }
}

export default AcademyService;
