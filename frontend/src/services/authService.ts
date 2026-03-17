import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { query, transaction } from "../lib/db";
import config from "../lib/config";
import logger from "../lib/logger";
import { sendPasswordResetEmail } from "../lib/email";
import ActivityLogService from "./activityLogService";
import { User, UserRole } from "../types/models";

const JWT_SECRET = config.jwtSecret;

export const generateToken = (user: any, expiresIn = "7d") =>
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
    { expiresIn: expiresIn as any },
  );

export const formatUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role as UserRole,
  rating: user.rating || 1200,
  academyId: user.academy_id,
  academyName: user.academy_name,
  academySubdomain: user.academy_subdomain,
  avatar: user.avatar,
  isActive: user.is_active,
  phone: user.phone || "",
  bio: user.bio || "",
});

export const AuthService = {
  async register(data: any, ip?: string) {
    const { name, email, password, role, academyName, academySubdomain } = data;

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    let academyId: string | null = null;

    await transaction(async (client) => {
      if (role === "academy_admin" && academyName) {
        const subdomain = (
          academySubdomain ||
          academyName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
        ).slice(0, 50);
        const existingSub = await client.query(
          "SELECT id FROM academies WHERE subdomain = $1",
          [subdomain],
        );
        if (existingSub.rows.length > 0) {
          throw new Error("Subdomain already taken");
        }
        const academy = await client.query(
          `INSERT INTO academies (id, name, subdomain, owner_id, plan, is_active, trial_ends_at, created_at)
           VALUES ($1, $2, $3, $4, 'trial', true, NOW() + INTERVAL '14 days', NOW())
           RETURNING id`,
          [uuidv4(), academyName, subdomain, userId],
        );
        academyId = academy.rows[0].id;
      }

      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, academy_id, rating, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1200, true, NOW())`,
        [userId, name, email, hashedPassword, role, academyId],
      );

      if (academyId) {
        await client.query("UPDATE academies SET owner_id = $1 WHERE id = $2", [
          userId,
          academyId,
        ]);
      }
    });

    const userResult = await query(
      `SELECT u.*, a.name as academy_name, a.subdomain as academy_subdomain
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id
       WHERE u.id = $1`,
      [userId],
    );
    const user = userResult.rows[0];
    const token = generateToken(user);

    logger.info(`New user registered: ${email} (${role})`);
    ActivityLogService.logActivity({
      actorId: userId,
      actorName: name,
      actorRole: role,
      academyId,
      action: "user_registered",
      entityType: "user",
      entityId: userId,
      metadata: { email, role },
      ip,
    });

    return { token, user: formatUser(user) };
  },

  async login(email: string, password: string, ip?: string) {
    const result = await query(
      `SELECT u.*, a.name as academy_name, a.subdomain as academy_subdomain,
              a.is_active as academy_is_active
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id
       WHERE u.email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error("Account is deactivated. Contact support.");
    }

    if (
      user.role !== "super_admin" &&
      user.academy_id &&
      user.academy_is_active === false
    ) {
      throw new Error(
        "Your academy has been suspended. Please contact support.",
      );
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error("Invalid email or password");
    }

    await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = generateToken(user);
    logger.info(`User logged in: ${email}`);

    ActivityLogService.logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      academyId: user.academy_id,
      action: "user_login",
      entityType: "user",
      entityId: user.id,
      metadata: { email },
      ip,
    });

    return { token, user: formatUser(user) };
  },

  async getUserById(userId: string) {
    const result = await query(
      `SELECT u.*, a.name as academy_name, a.subdomain as academy_subdomain
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id
       WHERE u.id = $1`,
      [userId],
    );
    if (result.rows.length === 0) return null;
    return formatUser(result.rows[0]);
  },
};
