// ─── BATCH / GROUP MESSAGES ───────────────────────────────────────────────────
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
// GET /api/messages/batch/:batchId — get group messages
router.get('/batch/:batchId', async (req, res) => {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(req.params.batchId)) return res.status(400).json({ message: 'Invalid' });
  try {
    // Verify user belongs to this batch (enrolled student, coach, or admin)
    const access = await query(
      `SELECT 1 FROM batches b
       LEFT JOIN batch_enrollments be ON be.batch_id = b.id AND be.student_id = $1
       WHERE b.id = $2 AND (b.coach_id = $1 OR be.student_id = $1 OR $3 IN ('academy_admin','super_admin'))
       LIMIT 1`,
      [req.user.id, req.params.batchId, req.user.role]
    );
    if (!access.rows.length) return res.status(403).json({ message: 'Not a member of this batch' });

    const { limit = 60, before } = req.query;
    const params = [req.params.batchId, parseInt(limit)];
    const beforeClause = before ? ` AND bm.created_at < $${params.push(before) && params.length}` : '';

    const result = await query(
      `SELECT bm.id, bm.batch_id, bm.content, bm.created_at,
        bm.sender_id, u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar
       FROM batch_messages bm
       JOIN users u ON u.id = bm.sender_id
       WHERE bm.batch_id = $1${beforeClause}
       ORDER BY bm.created_at ASC
       LIMIT $2`,
      params
    );
    res.json({ messages: result.rows });
  } catch (e) { console.error('[batch-messages]', e.message); res.status(500).json({ message: 'Failed' }); }
});

// POST /api/messages/batch/:batchId — send group message
router.post('/batch/:batchId', async (req, res) => {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(req.params.batchId)) return res.status(400).json({ message: 'Invalid' });
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    // Verify access
    const access = await query(
      `SELECT b.name FROM batches b
       LEFT JOIN batch_enrollments be ON be.batch_id = b.id AND be.student_id = $1
       WHERE b.id = $2 AND (b.coach_id = $1 OR be.student_id = $1 OR $3 IN ('academy_admin','super_admin'))
       LIMIT 1`,
      [req.user.id, req.params.batchId, req.user.role]
    );
    if (!access.rows.length) return res.status(403).json({ message: 'Not a member of this batch' });

    const id = uuidv4();
    await query(
      'INSERT INTO batch_messages (id, batch_id, sender_id, content, created_at) VALUES ($1,$2,$3,$4,NOW())',
      [id, req.params.batchId, req.user.id, content.trim()]
    );

    const msgPayload = {
      id,
      batch_id: req.params.batchId,
      sender_id: req.user.id,
      sender_name: req.user.name,
      sender_role: req.user.role,
      content: content.trim(),
      created_at: new Date(),
    };

    // Broadcast to all batch members via socket room
    if (req.io) {
      req.io.to(`batch:${req.params.batchId}`).emit('batch:message', msgPayload);
    }

    res.status(201).json({ message: 'Sent', id });
  } catch (e) { console.error('[batch-messages]', e.message); res.status(500).json({ message: 'Failed to send' }); }
});

// DELETE /api/messages/batch/:batchId/:msgId — delete own batch message
router.delete('/batch/:batchId/:msgId', async (req, res) => {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(req.params.msgId)) return res.status(400).json({ message: 'Invalid' });
  try {
    const result = await query(
      'DELETE FROM batch_messages WHERE id=$1 AND sender_id=$2 RETURNING id, batch_id',
      [req.params.msgId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found or not yours' });
    if (req.io) {
      req.io.to(`batch:${req.params.batchId}`).emit('batch:message_deleted', { id: req.params.msgId });
    }
    res.json({ message: 'Deleted' });
  } catch (e) { console.error('[batch-messages]', e.message); res.status(500).json({ message: 'Failed' }); }
});



// GET /api/messages/conversations
router.get('/conversations', async (req, res) => {
  try {
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
      [req.user.id]
    );
    res.json({ conversations: result.rows });
  } catch (e) { console.error("[messages]", e.message); res.status(500).json({ message: 'Failed', _route: 'messages' }); }
});

// GET /api/messages/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const result = await query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id=$1 AND m.receiver_id=$2) OR (m.sender_id=$2 AND m.receiver_id=$1)
       ORDER BY m.created_at ASC LIMIT $3`,
      [req.user.id, req.params.userId, limit]
    );
    // Mark as read
    await query(
      'UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2 AND is_read=false',
      [req.params.userId, req.user.id]
    );
    res.json({ messages: result.rows });
  } catch (e) { console.error("[messages]", e.message); res.status(500).json({ message: 'Failed', _route: 'messages' }); }
});

// POST /api/messages
router.post('/', async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content?.trim()) return res.status(400).json({ message: 'receiverId and content required' });
    const id = uuidv4();
    await query(
      'INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at) VALUES ($1,$2,$3,$4,false,NOW())',
      [id, req.user.id, receiverId, content.trim()]
    );
    // Real-time via socket
    const msgPayload = {
      id, sender_id: req.user.id, receiver_id: receiverId,
      sender_name: req.user.name, sender_role: req.user.role,
      content: content.trim(), created_at: new Date(), is_read: false
    };
    if (req.io) {
      req.io.to(`user:${receiverId}`).emit('message:new', msgPayload);
      req.io.to(`user:${req.user.id}`).emit('message:new', msgPayload);
    }
    res.status(201).json({ message: 'Sent', id });
  } catch (e) { console.error("[messages]", e.message); res.status(500).json({ message: 'Failed to send' }); }
});

// GET /api/messages/contacts/list  — people I can message
router.get('/contacts/list', async (req, res) => {
  try {
    let roleFilter = [];
    const role = req.user.role;
    if (role === 'student') roleFilter = ['coach', 'academy_admin'];
    else if (role === 'coach') roleFilter = ['student', 'academy_admin'];
    else if (role === 'parent') roleFilter = ['coach', 'academy_admin'];
    else if (role === 'academy_admin') roleFilter = ['coach', 'student', 'parent'];
    else roleFilter = ['academy_admin', 'coach', 'student', 'parent', 'super_admin'];

    const result = await query(
      `SELECT id, name, email, role, avatar FROM users
       WHERE role = ANY($1::text[]) AND academy_id = $2 AND is_active = true AND id != $3
       ORDER BY name ASC LIMIT 100`,
      [roleFilter, req.user.academyId, req.user.id]
    );
    res.json({ contacts: result.rows });
  } catch (e) { console.error("[messages]", e.message); res.status(500).json({ message: 'Failed', _route: 'messages' }); }
});

module.exports = router;

// GET /api/messages/unread-count — total unread messages
router.get('/unread-count', async (req, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id=$1 AND is_read=false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (e) { console.error('[messages]', e.message); res.status(500).json({ count: 0 }); }
});

// PUT /api/messages/:userId/read — mark conversation as read
router.put('/:userId/read', async (req, res) => {
  try {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(req.params.userId)) return res.status(400).json({ message: 'Invalid' });
    await query(
      'UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2 AND is_read=false',
      [req.params.userId, req.user.id]
    );
    res.json({ message: 'Marked read' });
  } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// DELETE /api/messages/:id — delete own message
router.delete('/:id', async (req, res) => {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(req.params.id)) return res.status(400).json({ message: 'Invalid' });
  try {
    const result = await query(
      'DELETE FROM messages WHERE id=$1 AND sender_id=$2 RETURNING id, receiver_id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found or not yours' });
    if (req.io) {
      req.io.to(`user:${result.rows[0].receiver_id}`).emit('message:deleted', { id: req.params.id });
    }
    res.json({ message: 'Deleted' });
  } catch (e) { console.error('[messages]', e.message); res.status(500).json({ message: 'Failed' }); }
});

// GET /api/messages/conversations with unread counts
// (override with better version that returns unread per convo)