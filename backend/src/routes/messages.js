const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/messages/conversations
router.get('/conversations', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (other_user)
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user,
        u.name as other_name, u.role as other_role, u.avatar as other_avatar,
        m.content as last_message, m.created_at as last_at, m.is_read,
        m.sender_id
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id=$1 OR m.receiver_id=$1
       ORDER BY other_user, m.created_at DESC`,
      [req.user.id]
    );
    res.json({ conversations: result.rows });
  } catch(e) { res.status(500).json({ message: 'Failed' }); }
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
  } catch(e) { res.status(500).json({ message: 'Failed' }); }
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
    if (req.io) {
      req.io.to(`user:${receiverId}`).emit('message:new', {
        id, senderId: req.user.id, senderName: req.user.name, content: content.trim(), createdAt: new Date()
      });
    }
    res.status(201).json({ message: 'Sent', id });
  } catch(e) { res.status(500).json({ message: 'Failed to send' }); }
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
  } catch(e) { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
