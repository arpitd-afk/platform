import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import config from "../lib/config";
import logger from "../lib/logger";
import ActivityLogService from "./activityLogService";
import { UserRole } from "../types/models";

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
  academyName: user.academy?.name || user.academy_name,
  academySubdomain: user.academy?.subdomain || user.academy_subdomain,
  avatar: user.avatar,
  isActive: user.is_active,
  phone: user.phone || "",
  bio: user.bio || "",
});

export const AuthService = {
  async register(data: any, ip?: string) {
    const { name, email, password, role, academyName, academySubdomain } = data;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      let academyId: string | null = null;
      let userId: string;

      // 1. Create the user first (or after academy, but we need userId for owner_id)
      // Actually in original schema owner_id is nullable.

      if (role === "academy_admin" && academyName) {
        const subdomain = (
          academySubdomain ||
          academyName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
        ).slice(0, 50);

        const existingSub = await tx.academy.findUnique({
          where: { subdomain },
          select: { id: true },
        });
        if (existingSub) {
          throw new Error("Subdomain already taken");
        }

        const academy = await tx.academy.create({
          data: {
            name: academyName,
            subdomain,
            plan: "trial",
            is_active: true,
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
        academyId = academy.id;
      }

      const user = await tx.user.create({
        data: {
          name,
          email,
          password_hash: hashedPassword,
          role,
          academy_id: academyId,
          rating: 1200,
          is_active: true,
        },
      });
      userId = user.id;

      if (academyId) {
        await tx.academy.update({
          where: { id: academyId },
          data: { owner_id: userId },
        });
      }

      return { userId, academyId };
    });

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      include: { academy: { select: { name: true, subdomain: true } } },
    });

    if (!user) throw new Error("Registration failed");

    const token = generateToken(user);

    logger.info(`New user registered: ${email} (${role})`);
    ActivityLogService.logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      academyId: user.academy_id,
      action: "user_registered",
      entityType: "user",
      entityId: user.id,
      metadata: { email, role },
      ip,
    });

    return { token, user: formatUser(user) };
  },

  async login(email: string, password: string, ip?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        academy: {
          select: { name: true, subdomain: true, is_active: true },
        },
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.is_active) {
      throw new Error("Account is deactivated. Contact support.");
    }

    if (
      user.role !== "super_admin" &&
      user.academy_id &&
      user.academy?.is_active === false
    ) {
      throw new Error(
        "Your academy has been suspended. Please contact support.",
      );
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error("Invalid email or password");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academy: { select: { name: true, subdomain: true } } },
    });
    if (!user) return null;
    return formatUser(user);
  },
};
