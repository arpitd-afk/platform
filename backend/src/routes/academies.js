const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { cache } = require('../config/redis');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { logActivity } = require('./activityLogs');

const router = express.Router();
router.use(authenticate);

// GET /api/academies - List academies (super admin only)
router.get('/', authorize('super_admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, plan, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let conditions = ['1=1'];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(a.name ILIKE $${params.length} OR a.subdomain ILIKE $${params.length})`);
    }
    if (plan) {
      params.push(plan);
      conditions.push(`a.plan = $${params.length}`);
    }
    if (status === 'active') conditions.push('a.is_active = true');
    if (status === 'inactive') conditions.push('a.is_active = false');

    params.push(Number(limit), offset);

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
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM academies a WHERE ${conditions.slice(0, -2).join(' AND ') || '1=1'}`,
      params.slice(0, -2)
    );

    res.json({
      academies: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    logger.error('Get academies error:', error);
    res.status(500).json({ message: 'Failed to get academies' });
  }
});

// GET /api/academies/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Only super admin or academy members can view
    if (req.user.role !== 'super_admin' && req.user.academyId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const cacheKey = `academy:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ academy: cached });

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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Academy not found' });
    }

    await cache.set(cacheKey, result.rows[0], 300);
    res.json({ academy: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get academy' });
  }
});

// POST /api/academies - Super admin creates academy
router.post('/', authorize('super_admin'), [
  body('name').trim().isLength({ min: 2, max: 200 }),
  body('subdomain').matches(/^[a-z0-9-]+$/).isLength({ min: 3, max: 50 }),
  body('ownerEmail').isEmail().normalizeEmail(),
  body('plan').isIn(['trial', 'starter', 'academy', 'enterprise']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, subdomain, ownerEmail, ownerName, ownerPassword, plan } = req.body;

    const existingSub = await query('SELECT id FROM academies WHERE subdomain = $1', [subdomain]);
    if (existingSub.rows.length > 0) {
      return res.status(409).json({ message: 'Subdomain already taken' });
    }

    // Create academy first (owner assigned after)
    const academyId = uuidv4();
    await query(
      `INSERT INTO academies (id, name, subdomain, plan, is_active, trial_ends_at, created_at)
       VALUES ($1, $2, $3, $4, true, NOW() + INTERVAL '14 days', NOW())`,
      [academyId, name, subdomain, plan]
    );

    // Find or create the academy admin user
    let ownerId = null;
    if (ownerEmail) {
      const existing = await query('SELECT id FROM users WHERE email = $1', [ownerEmail]);
      if (existing.rows.length > 0) {
        ownerId = existing.rows[0].id;
        // Update their academy assignment
        await query(
          'UPDATE users SET academy_id = $1, role = $2 WHERE id = $3',
          [academyId, 'academy_admin', ownerId]
        );
      } else if (ownerName) {
        // Create new academy_admin account
        const hash = await bcrypt.hash(ownerPassword || 'Admin@123', 10);
        ownerId = uuidv4();
        await query(
          `INSERT INTO users (id, name, email, password_hash, role, academy_id, is_active, created_at)
           VALUES ($1, $2, $3, $4, 'academy_admin', $5, true, NOW())`,
          [ownerId, ownerName, ownerEmail, hash, academyId]
        );
      }

      // Link owner to academy
      if (ownerId) {
        await query('UPDATE academies SET owner_id = $1 WHERE id = $2', [ownerId, academyId]);
      }
    }

    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId: academyId, action: 'academy_created', entityType: 'academy', entityId: academyId, metadata: { name, subdomain, plan }, ip: req.ip });

    res.status(201).json({ message: 'Academy created', academyId, ownerId });
  } catch (error) {
    logger.error('Create academy error:', error);
    res.status(500).json({ message: 'Failed to create academy' });
  }
});

// PUT /api/academies/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'super_admin' && req.user.academyId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, settings, theme, plan } = req.body;
    const fields = [];
    const vals = [];
    if (name !== undefined) { vals.push(name); fields.push(`name=$${vals.length}`); }
    if (settings !== undefined) { vals.push(JSON.stringify(settings)); fields.push(`settings=$${vals.length}`); }
    if (theme !== undefined) { vals.push(JSON.stringify(theme)); fields.push(`theme=$${vals.length}`); }
    if (plan !== undefined) { vals.push(plan); fields.push(`plan=$${vals.length}`); }
    if (fields.length === 0) return res.json({ message: 'Nothing to update' });
    vals.push(id);
    await query(`UPDATE academies SET ${fields.join(',')} , updated_at=NOW() WHERE id=$${vals.length}`, vals);

    await cache.del(`academy:${id}`);
    res.json({ message: 'Academy updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update academy' });
  }
});

// POST /api/academies/:id/suspend
router.post('/:id/suspend', authorize('super_admin'), async (req, res) => {
  try {
    await query('UPDATE academies SET is_active = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
    await cache.del(`academy:${req.params.id}`);
    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId: req.params.id, action: 'academy_suspended', entityType: 'academy', entityId: req.params.id, ip: req.ip });
    res.json({ message: 'Academy suspended' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to suspend academy' });
  }
});

// POST /api/academies/:id/activate
router.post('/:id/activate', authorize('super_admin'), async (req, res) => {
  try {
    await query('UPDATE academies SET is_active = true, updated_at = NOW() WHERE id = $1', [req.params.id]);
    await cache.del(`academy:${req.params.id}`);
    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId: req.params.id, action: 'academy_activated', entityType: 'academy', entityId: req.params.id, ip: req.ip });
    res.json({ message: 'Academy activated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to activate academy' });
  }
});

// GET /api/academies/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'super_admin' && req.user.academyId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const cacheKey = `academy:${id}:stats`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

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

    await cache.set(cacheKey, stats, 600);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

module.exports = router;