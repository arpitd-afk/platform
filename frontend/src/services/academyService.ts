import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query } from '../lib/db';
import { cache as redis } from '../lib/redis';
import ActivityLogService from './activityLogService';

export class AcademyService {
  static async listAcademies(params: { page?: number, limit?: number, search?: string, plan?: string, status?: string }) {
    const { page = 1, limit = 20, search, plan, status } = params;
    const offset = (page - 1) * limit;

    let conditions = ['1=1'];
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      conditions.push(`(a.name ILIKE $${queryParams.length} OR a.subdomain ILIKE $${queryParams.length})`);
    }
    if (plan) {
      queryParams.push(plan);
      conditions.push(`a.plan = $${queryParams.length}`);
    }
    if (status === 'active') conditions.push('a.is_active = true');
    if (status === 'inactive') conditions.push('a.is_active = false');

    queryParams.push(limit, offset);

    const result = await query(
      `SELECT a.*,
        u.name as owner_name, u.email as owner_email,
        COUNT(DISTINCT s.id) FILTER (WHERE s.role = 'student') as student_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.role = 'coach') as coach_count
       FROM academies a
       LEFT JOIN users u ON a.owner_id = u.id
       LEFT JOIN users s ON s.academy_id = a.id AND s.role = 'student'
       LEFT JOIN users c ON c.academy_id = a.id AND c.role = 'coach'
       WHERE ${conditions.join(' AND ')}
       GROUP BY a.id, u.name, u.email
       ORDER BY a.created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM academies a WHERE ${conditions.join(' AND ')}`,
      queryParams.slice(0, -2)
    );

    return {
      academies: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  static async getById(id: string) {
    const cacheKey = `academy:${id}`;
    const cached = await redis.get<any>(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await query(
      `SELECT a.*,
        u.name as owner_name, u.email as owner_email,
        COUNT(DISTINCT s.id) FILTER (WHERE s.role = 'student' AND s.is_active) as student_count,
        COUNT(DISTINCT c.id) FILTER (WHERE c.role = 'coach' AND c.is_active) as coach_count,
        COUNT(DISTINCT b.id) FILTER (WHERE b.is_active) as batch_count
       FROM academies a
       LEFT JOIN users u ON a.owner_id = u.id
       LEFT JOIN users s ON s.academy_id = a.id
       LEFT JOIN users c ON c.academy_id = a.id
       LEFT JOIN batches b ON b.academy_id = a.id
       WHERE a.id = $1
       GROUP BY a.id, u.name, u.email`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const academy = result.rows[0];
    await redis.set(cacheKey, academy, 300);
    return academy;
  }

  static async createAcademy(data: any, currentUser?: any) {
    const { name, subdomain, ownerEmail, ownerName, ownerPassword, plan } = data;

    const existingSub = await query('SELECT id FROM academies WHERE subdomain = $1', [subdomain]);
    if (existingSub.rows.length > 0) throw new Error('Subdomain already taken');

    const academyId = uuidv4();
    await query(
      `INSERT INTO academies (id, name, subdomain, plan, is_active, trial_ends_at, created_at)
       VALUES ($1, $2, $3, $4, true, NOW() + INTERVAL '14 days', NOW())`,
      [academyId, name, subdomain, plan]
    );

    let ownerId = null;
    if (ownerEmail) {
      const existing = await query('SELECT id FROM users WHERE email = $1', [ownerEmail]);
      if (existing.rows.length > 0) {
        ownerId = existing.rows[0].id;
        await query(
          'UPDATE users SET academy_id = $1, role = $2 WHERE id = $3',
          [academyId, 'academy_admin', ownerId]
        );
      } else if (ownerName) {
        const hash = await bcrypt.hash(ownerPassword || 'Admin@123', 10);
        ownerId = uuidv4();
        await query(
          `INSERT INTO users (id, name, email, password_hash, role, academy_id, is_active, created_at)
           VALUES ($1, $2, $3, $4, 'academy_admin', $5, true, NOW())`,
          [ownerId, ownerName, ownerEmail, hash, academyId]
        );
      }

      if (ownerId) {
        await query('UPDATE academies SET owner_id = $1 WHERE id = $2', [ownerId, academyId]);
      }
    }

    if (currentUser) {
      await ActivityLogService.logActivity({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        academyId: academyId,
        action: 'academy_created',
        entityType: 'academy',
        entityId: academyId,
        metadata: { name, subdomain, plan }
      });
    } else {
      await ActivityLogService.logActivity({
        actorId: ownerId || 'system',
        actorName: ownerName || 'Public Registration',
        actorRole: 'academy_admin',
        academyId: academyId,
        action: 'academy_registered',
        entityType: 'academy',
        entityId: academyId,
        metadata: { name, subdomain, plan, ownerEmail }
      });
    }

    return { academyId, ownerId };
  }

  static async updateAcademy(id: string, data: any) {
    const { name, settings, theme, plan } = data;
    const fields = [];
    const vals = [];
    if (name !== undefined) { vals.push(name); fields.push(`name=$${vals.length}`); }
    if (settings !== undefined) { vals.push(JSON.stringify(settings)); fields.push(`settings=$${vals.length}`); }
    if (theme !== undefined) { vals.push(JSON.stringify(theme)); fields.push(`theme=$${vals.length}`); }
    if (plan !== undefined) { vals.push(plan); fields.push(`plan=$${vals.length}`); }
    
    if (fields.length > 0) {
      vals.push(id);
      await query(`UPDATE academies SET ${fields.join(',')} , updated_at=NOW() WHERE id=$${vals.length}`, vals);
    }

    await redis.del(`academy:${id}`);
  }

  static async setStatus(id: string, active: boolean, currentUser: any) {
    await query('UPDATE academies SET is_active = $1, updated_at = NOW() WHERE id = $2', [active, id]);
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
    if (cached) return JSON.parse(cached);

    const [students, coaches, games, tournaments, classrooms] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE academy_id = $1 AND role = 'student' AND is_active = true", [id]),
      query("SELECT COUNT(*) FROM users WHERE academy_id = $1 AND role = 'coach' AND is_active = true", [id]),
      query("SELECT COUNT(*) FROM games g JOIN users u ON (g.white_player_id = u.id OR g.black_player_id = u.id) WHERE u.academy_id = $1 AND g.created_at > NOW() - INTERVAL '30 days'", [id]),
      query("SELECT COUNT(*) FROM tournaments WHERE academy_id = $1", [id]),
      query("SELECT COUNT(*) FROM classrooms WHERE academy_id = $1 AND status = 'completed' AND created_at > NOW() - INTERVAL '30 days'", [id]),
    ]);

    const stats = {
      students: parseInt(students.rows[0].count),
      coaches: parseInt(coaches.rows[0].count),
      gamesThisMonth: parseInt(games.rows[0].count),
      tournaments: parseInt(tournaments.rows[0].count),
      classroomsThisMonth: parseInt(classrooms.rows[0].count),
    };

    await redis.set(cacheKey, stats, 600);
    return stats;
  }
}

export default AcademyService;
