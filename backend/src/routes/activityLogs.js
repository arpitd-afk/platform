const express = require('express')
const { query } = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// GET /api/activity-logs - super admin gets global, academy admin gets their own
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, academy_id, action, entity_type } = req.query
    const offset = (page - 1) * limit
    const params = []
    const conditions = []

    if (req.user.role === 'super_admin') {
      if (academy_id) { params.push(academy_id); conditions.push(`al.academy_id = $${params.length}`) }
    } else if (req.user.role === 'academy_admin') {
      params.push(req.user.academy_id)
      conditions.push(`al.academy_id = $${params.length}`)
    } else {
      return res.status(403).json({ message: 'Forbidden' })
    }

    if (action) { params.push(`%${action}%`); conditions.push(`al.action ILIKE $${params.length}`) }
    if (entity_type) { params.push(entity_type); conditions.push(`al.entity_type = $${params.length}`) }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await query(
      `SELECT al.*, a.name as academy_name
       FROM activity_logs al
       LEFT JOIN academies a ON al.academy_id = a.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )

    const total = await query(
      `SELECT COUNT(*) FROM activity_logs al ${where}`,
      params
    )

    res.json({ logs: result.rows, total: parseInt(total.rows[0].count) })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get logs' })
  }
})

// Helper to log an action (used internally)
async function logActivity(data) {
  try {
    await query(
      `INSERT INTO activity_logs (actor_id, actor_name, actor_role, academy_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [data.actorId, data.actorName, data.actorRole, data.academyId, data.action,
       data.entityType || null, data.entityId || null, JSON.stringify(data.metadata || {}), data.ip || null]
    )
  } catch {}
}

module.exports = { router, logActivity }
