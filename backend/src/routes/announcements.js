const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/announcements — list for current user's academy
router.get('/', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const result = await query(
            `SELECT a.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.academy_id = $1
         AND (a.target_role IS NULL OR a.target_role = $2)
       ORDER BY a.is_pinned DESC, a.created_at DESC
       LIMIT $3`,
            [req.user.academy_id, req.user.role, parseInt(limit)]
        );
        res.json({ announcements: result.rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to get announcements' });
    }
});

// GET /api/announcements/all — admin: all, including role-filtered
router.get('/all', authorize('academy_admin', 'super_admin'), async (req, res) => {
    try {
        const result = await query(
            `SELECT a.*, u.name as author_name, u.avatar as author_avatar,
        (SELECT COUNT(*) FROM users WHERE academy_id = a.academy_id
          AND (a.target_role IS NULL OR role = a.target_role)) as reach
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.academy_id = $1
       ORDER BY a.is_pinned DESC, a.created_at DESC`,
            [req.user.academy_id]
        );
        res.json({ announcements: result.rows });
    } catch (e) {
        res.status(500).json({ message: 'Failed' });
    }
});

// POST /api/announcements — create
router.post('/', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
    try {
        const { title, body, targetRole = null, isPinned = false } = req.body;
        if (!title || !body) return res.status(400).json({ message: 'Title and body required' });

        const id = uuidv4();
        await query(
            `INSERT INTO announcements (id, academy_id, author_id, title, body, target_role, is_pinned, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [id, req.user.academy_id, req.user.id, title, body, targetRole || null, isPinned]
        );

        // Push real-time notification via socket
        if (req.io) {
            req.io.to(`academy:${req.user.academy_id}`).emit('announcement:new', {
                id, title, body, targetRole, isPinned,
                author_name: req.user.name,
                created_at: new Date().toISOString(),
            });
        }

        // Email the audience (fire-and-forget)
        try {
            const { sendAnnouncementEmail } = require('../services/emailService');
            const audience = await query(
                `SELECT email, name FROM users
         WHERE academy_id=$1 AND is_active=true
           AND (${targetRole ? 'role=$2' : '$2::text IS NULL'})`,
                [req.user.academy_id, targetRole]
            );
            for (const u of audience.rows) {
                sendAnnouncementEmail({ to: u.email, name: u.name, title, body, authorName: req.user.name }).catch(() => { });
            }
        } catch (_) { }

        res.status(201).json({ message: 'Announcement posted', id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to create announcement' });
    }
});

// PUT /api/announcements/:id — edit
router.put('/:id', authorize('coach', 'academy_admin', 'super_admin'), async (req, res) => {
    try {
        const { title, body, targetRole, isPinned } = req.body;
        await query(
            `UPDATE announcements SET
         title       = COALESCE($1, title),
         body        = COALESCE($2, body),
         target_role = $3,
         is_pinned   = COALESCE($4, is_pinned)
       WHERE id=$5 AND academy_id=$6`,
            [title, body, targetRole ?? null, isPinned, req.params.id, req.user.academy_id]
        );
        res.json({ message: 'Updated' });
    } catch (e) {
        res.status(500).json({ message: 'Failed' });
    }
});

// DELETE /api/announcements/:id
router.delete('/:id', authorize('academy_admin', 'super_admin'), async (req, res) => {
    try {
        await query(
            'DELETE FROM announcements WHERE id=$1 AND academy_id=$2',
            [req.params.id, req.user.academy_id]
        );
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Failed' });
    }
});

// PUT /api/announcements/:id/pin — toggle pin
router.put('/:id/pin', authorize('academy_admin', 'super_admin'), async (req, res) => {
    try {
        const { pinned } = req.body;
        await query(
            'UPDATE announcements SET is_pinned=$1 WHERE id=$2 AND academy_id=$3',
            [pinned, req.params.id, req.user.academy_id]
        );
        res.json({ message: pinned ? 'Pinned' : 'Unpinned' });
    } catch (e) {
        res.status(500).json({ message: 'Failed' });
    }
});

module.exports = router;