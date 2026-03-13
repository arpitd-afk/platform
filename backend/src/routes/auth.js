const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { cache } = require('../config/redis');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendPasswordResetEmail } = require('../services/emailService');
const config = require('../config');
const { logActivity } = require('./activityLogs');

const router = express.Router();

const JWT_SECRET = config.jwtSecret;

const generateToken = (user, expiresIn = '7d') =>
  jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        academyId: user.academy_id,
        rating: user.rating,
      },
    },
    JWT_SECRET,
    { expiresIn }
  );

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  rating: user.rating || 1200,
  academyId: user.academy_id,
  academyName: user.academy_name,
  academySubdomain: user.academy_subdomain,
  avatar: user.avatar,
  isActive: user.is_active,
  phone: user.phone || '',
  bio: user.bio || '',
});

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['academy_admin', 'coach', 'student', 'parent']).withMessage('Invalid role'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, password, role, academyName, academySubdomain } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    let academyId = null;

    await transaction(async (client) => {
      if (role === 'academy_admin' && academyName) {
        const subdomain = (academySubdomain || academyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).slice(0, 50);
        const existingSub = await client.query('SELECT id FROM academies WHERE subdomain = $1', [subdomain]);
        if (existingSub.rows.length > 0) {
          throw new Error('Subdomain already taken');
        }
        const academy = await client.query(
          `INSERT INTO academies (id, name, subdomain, owner_id, plan, is_active, trial_ends_at, created_at)
           VALUES ($1, $2, $3, $4, 'trial', true, NOW() + INTERVAL '14 days', NOW())
           RETURNING id`,
          [uuidv4(), academyName, subdomain, userId]
        );
        academyId = academy.rows[0].id;
      }

      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, academy_id, rating, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1200, true, NOW())`,
        [userId, name, email, hashedPassword, role, academyId]
      );

      if (academyId) {
        await client.query('UPDATE academies SET owner_id = $1 WHERE id = $2', [userId, academyId]);
      }
    });

    const userResult = await query(
      `SELECT u.*, a.name as academy_name, a.subdomain as academy_subdomain
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id
       WHERE u.id = $1`,
      [userId]
    );
    const user = userResult.rows[0];
    const token = generateToken(user);

    logger.info(`New user registered: ${email} (${role})`);

    logActivity({ actorId: userId, actorName: name, actorRole: role, academyId, action: 'user_registered', entityType: 'user', entityId: userId, metadata: { email, role }, ip: req.ip });

    res.status(201).json({ message: 'Account created successfully', token, user: formatUser(user) });
  } catch (error) {
    if (error.message === 'Subdomain already taken') {
      return res.status(409).json({ message: 'Subdomain already taken' });
    }
    logger.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const { email, password } = req.body;

    const result = await query(
      `SELECT u.*, a.name as academy_name, a.subdomain as academy_subdomain,
              a.is_active as academy_is_active
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated. Contact support.' });
    }

    // Block login if their academy is suspended (except super_admin)
    if (user.role !== 'super_admin' && user.academy_id && user.academy_is_active === false) {
      return res.status(403).json({ message: 'Your academy has been suspended. Please contact support.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    logger.info(`User logged in: ${email}`);

    logActivity({ actorId: user.id, actorName: user.name, actorRole: user.role, academyId: user.academy_id, action: 'user_login', entityType: 'user', entityId: user.id, metadata: { email }, ip: req.ip });

    res.json({ message: 'Login successful', token, user: formatUser(user) });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, a.name as academy_name, a.subdomain as academy_subdomain
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id
       WHERE u.id = $1 AND u.is_active = true`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    const token = generateToken(result.rows[0]);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, a.name as academy_name, a.subdomain as academy_subdomain
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: formatUser(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await cache.del(`session:${req.user.id}`);
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query('SELECT id, name FROM users WHERE email = $1', [email]);

    // Always return success to prevent email enumeration
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const resetToken = uuidv4();
      await query(
        `UPDATE users SET reset_token = $1, reset_token_expires = NOW() + INTERVAL '1 hour' WHERE id = $2`,
        [resetToken, user.id]
      );
      // Send reset email (async, fire and forget)
      sendPasswordResetEmail({ to: email, name: user.name, resetToken }).catch(e =>
        logger.error('Reset email failed:', e.message)
      );
      logger.info(`Password reset requested for ${email}`);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, result.rows[0].id]
    );
    logActivity({ actorId: result.rows[0].id, actorName: null, actorRole: null, academyId: null, action: 'password_reset', entityType: 'user', entityId: result.rows[0].id, ip: req.ip });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed' });
  }
});

module.exports = router;