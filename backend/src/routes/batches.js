const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/batches
router.get('/', async (req, res) => {
  try {
    const { academyId, coachId, level } = req.query;
    const conditions = ['1=1'];
    const params = [];

    const targetAcademy = academyId || req.user.academyId;
    if (targetAcademy) { params.push(targetAcademy); conditions.push(`b.academy_id=$${params.length}`); }
    if (coachId) { params.push(coachId); conditions.push(`b.coach_id=$${params.length}`); }
    if (level) { params.push(level); conditions.push(`b.level=$${params.length}`); }

    const result = await query(
      `SELECT b.*, u.name as coach_name,
        COUNT(DISTINCT be.student_id) as student_count
       FROM batches b
       LEFT JOIN users u ON b.coach_id = u.id
       LEFT JOIN batch_enrollments be ON be.batch_id = b.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY b.id, u.name
       ORDER BY b.created_at DESC`,
      params
    );
    res.json({ batches: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to get batches' }); }
});

// GET /api/batches/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, u.name as coach_name, u.email as coach_email,
        COUNT(DISTINCT be.student_id) as student_count
       FROM batches b
       LEFT JOIN users u ON b.coach_id = u.id
       LEFT JOIN batch_enrollments be ON be.batch_id = b.id
       WHERE b.id = $1 GROUP BY b.id, u.name, u.email`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Batch not found' });
    res.json({ batch: result.rows[0] });
  } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/batches
router.post('/', async (req, res) => {
  try {
    if (!['academy_admin','super_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { name, coachId, level = 'beginner', maxStudents = 20, schedule, description } = req.body;
    if (!name || !coachId) return res.status(400).json({ message: 'name and coachId required' });
    const id = uuidv4();
    await query(
      'INSERT INTO batches (id, academy_id, coach_id, name, level, max_students, schedule, description, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())',
      [id, req.user.academyId, coachId, name, level, maxStudents, schedule||null, description||null]
    );
    res.status(201).json({ message: 'Batch created', id });
  } catch (e) { res.status(500).json({ message: 'Failed to create batch' }); }
});

// PUT /api/batches/:id
router.put('/:id', async (req, res) => {
  try {
    if (!['academy_admin','super_admin','coach'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { name, coachId, level, maxStudents, schedule, description, isActive } = req.body;
    await query(
      `UPDATE batches SET
        name=COALESCE($1,name), coach_id=COALESCE($2,coach_id), level=COALESCE($3,level),
        max_students=COALESCE($4,max_students), schedule=COALESCE($5,schedule),
        description=COALESCE($6,description), is_active=COALESCE($7,is_active),
        updated_at=NOW()
       WHERE id=$8`,
      [name, coachId, level, maxStudents, schedule, description, isActive, req.params.id]
    );
    res.json({ message: 'Batch updated' });
  } catch (e) { res.status(500).json({ message: 'Failed to update batch' }); }
});

// DELETE /api/batches/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!['academy_admin','super_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    await query('UPDATE batches SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Batch deleted' });
  } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/batches/:id/students
router.get('/:id/students', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.rating, u.avatar, be.enrolled_at
       FROM batch_enrollments be
       JOIN users u ON be.student_id = u.id
       WHERE be.batch_id = $1
       ORDER BY u.name ASC`,
      [req.params.id]
    );
    res.json({ students: result.rows });
  } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/batches/:id/enroll
router.post('/:id/enroll', async (req, res) => {
  try {
    if (!['academy_admin','super_admin','coach'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { userId } = req.body;
    const exists = await query('SELECT id FROM batch_enrollments WHERE batch_id=$1 AND student_id=$2', [req.params.id, userId]);
    if (exists.rows.length) return res.status(409).json({ message: 'Already enrolled' });
    await query(
      'INSERT INTO batch_enrollments (id, batch_id, student_id, enrolled_at) VALUES ($1,$2,$3,NOW())',
      [uuidv4(), req.params.id, userId]
    );
    res.status(201).json({ message: 'Student enrolled' });
  } catch (e) { res.status(500).json({ message: 'Failed to enroll' }); }
});

// DELETE /api/batches/:id/enroll/:userId
router.delete('/:id/enroll/:userId', async (req, res) => {
  try {
    await query('DELETE FROM batch_enrollments WHERE batch_id=$1 AND student_id=$2', [req.params.id, req.params.userId]);
    res.json({ message: 'Student removed' });
  } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
