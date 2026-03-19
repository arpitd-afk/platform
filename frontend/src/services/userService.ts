import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

export class UserService {
  static async listUsers(
    params: {
      academyId?: string;
      role?: string;
      page?: number;
      limit?: number;
      status?: string;
    },
    currentUser: any,
  ) {
    const { academyId, role, page = 1, limit = 50, status } = params;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (currentUser.role === "super_admin") {
      if (status === "active") where.is_active = true;
      else if (status === "inactive") where.is_active = false;
      if (academyId) where.academy_id = academyId;
    } else {
      where.is_active = true;
      const targetAcademy = academyId || currentUser.academyId;
      if (targetAcademy) where.academy_id = targetAcademy;

      if (currentUser.role === "coach") {
        where.assigned_coach_id = currentUser.id;
      }
    }

    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { name: "asc" },
      include: {
        academy: { select: { name: true } },
        coach: { select: { name: true, avatar: true } },
        batch_enrollments: {
          where: { is_active: true },
          include: { batch: { select: { id: true, name: true } } },
        },
        student_of: {
          include: { parent: { select: { name: true, email: true } } },
        },
        _count: {
          select: {
            white_games: { where: { status: "completed" } },
            black_games: { where: { status: "completed" } },
          },
        },
      },
    });

    // Remap to match previous return structure
    return users.map((u) => ({
      ...u,
      academy_name: u.academy?.name,
      assigned_coach_name: u.coach?.name,
      assigned_coach_avatar: u.coach?.avatar,
      batch_id: u.batch_enrollments[0]?.batch?.id,
      batch_name: u.batch_enrollments[0]?.batch?.name,
      parents: u.student_of.map((ps) => ({
        name: ps.parent.name,
        email: ps.parent.email,
      })),
      games_played: u._count.white_games + u._count.black_games,
    }));
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        academy: { select: { name: true } },
      },
    });

    if (!user) return null;

    return {
      ...user,
      academy_name: user.academy?.name,
    };
  }

  static async update(id: string, data: any, currentUser: any) {
    const isSelf = currentUser.id === id;
    const isAdmin = ["super_admin", "academy_admin"].includes(currentUser.role);
    if (!isSelf && !isAdmin) throw new Error("Not authorized");

    const { name, bio, phone, is_active, batch_id } = data;
    const updateData: any = { updated_at: new Date() };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined && isAdmin) updateData.is_active = is_active;

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (batch_id !== undefined && isAdmin) {
      await prisma.batchEnrollment.updateMany({
        where: { student_id: id },
        data: { is_active: false },
      });
      if (batch_id) {
        await prisma.batchEnrollment.upsert({
          where: { batch_id_student_id: { batch_id, student_id: id } },
          update: { is_active: true },
          create: { batch_id, student_id: id, is_active: true },
        });
      }
    }

    return this.getById(id);
  }

  static async getStats(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        rating: true,
        role: true,
        _count: {
          select: {
            white_games: { where: { status: "completed" } },
            black_games: { where: { status: "completed" } },
            puzzle_attempts: true,
            custom_puzzle_attempts: true,
            mcq_attempts: true,
          },
        },
      },
    });

    if (!user) return null;

    const winsCount = await prisma.game.count({
      where: {
        status: "completed",
        OR: [
          {
            white_player_id: id,
            result: { path: ["winner"], equals: "white" },
          },
          {
            black_player_id: id,
            result: { path: ["winner"], equals: "black" },
          },
        ],
      },
    });

    const [correctLichess, correctCustom, correctMcq] = await Promise.all([
      prisma.puzzleAttempt.count({ where: { user_id: id, is_correct: true } }),
      prisma.customPuzzleAttempt.count({ where: { user_id: id, is_correct: true } }),
      prisma.mcqAttempt.count({ where: { user_id: id, is_correct: true } }),
    ]);

    const stats: any = {
      rating: user.rating,
      games: {
        total: user._count.white_games + user._count.black_games,
        wins: winsCount,
      },
      puzzles: {
        lichess_total: user._count.puzzle_attempts,
        lichess_correct: correctLichess,
        custom_total: user._count.custom_puzzle_attempts,
        custom_correct: correctCustom,
        mcq_total: user._count.mcq_attempts,
        mcq_correct: correctMcq,
        total:
          user._count.puzzle_attempts +
          user._count.custom_puzzle_attempts +
          user._count.mcq_attempts,
        correct: correctLichess + correctCustom + correctMcq,
      },
    };

    if (user.role === "coach") {
      const assignedStudents = await prisma.user.count({
        where: { assigned_coach_id: id },
      });

      const batchStudents = await prisma.batchEnrollment.count({
        where: {
          is_active: true,
          batch: { coach_id: id },
        },
      });

      const completedClasses = await prisma.classroom.count({
        where: { coach_id: id, status: "completed" },
      });

      stats.students = assignedStudents + batchStudents; // This is a rough estimation compared to the UNION
      stats.classes = completedClasses;
    }

    return stats;
  }

  static async getRatingHistory(userId: string, limit: number = 30) {
    return prisma.ratingHistory
      .findMany({
        where: { user_id: userId },
        orderBy: { recorded_at: "asc" },
        take: limit,
        select: {
          rating: true,
          recorded_at: true,
        },
      })
      .then((res) =>
        res.map((r) => ({ rating: r.rating, date: r.recorded_at })),
      );
  }

  static async getAttendance(userId: string, limit: number = 60) {
    // This is a bit more complex due to the LEFT JOINs and CASE.
    // For now, let's stick to standard prisma findMany and map.
    const classrooms = await prisma.classroom.findMany({
      where: {
        status: { in: ["completed", "live"] },
        OR: [
          {
            batch: {
              enrollments: { some: { student_id: userId, is_active: true } },
            },
          },
          { attendance: { some: { student_id: userId } } },
        ],
      },
      include: {
        batch: { select: { name: true } },
        attendance: { where: { student_id: userId } },
      },
      orderBy: { scheduled_at: "desc" },
      take: limit,
    });

    return classrooms.map((cl) => ({
      classroom_id: cl.id,
      class_title: cl.title,
      scheduled_at: cl.scheduled_at,
      class_status: cl.status,
      duration_min: cl.duration_min,
      batch_name: cl.batch?.name,
      status: cl.attendance.length > 0 ? "present" : "absent",
      joined_at: cl.attendance[0]?.joined_at,
      actual_duration_min: cl.attendance[0]?.duration_min,
    }));
  }

  static async getGames(userId: string, limit: number = 20) {
    const games = await prisma.game.findMany({
      where: {
        OR: [{ white_player_id: userId }, { black_player_id: userId }],
        status: "completed",
      },
      include: {
        white_player: { select: { name: true, rating: true } },
        black_player: { select: { name: true, rating: true } },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return games.map((g) => ({
      ...g,
      white_name: g.white_player?.name,
      black_name: g.black_player?.name,
      white_rating: g.white_player?.rating,
      black_rating: g.black_player?.rating,
    }));
  }

  static async createUser(data: any, currentUser: any) {
    const {
      name,
      email,
      password,
      role,
      batchId,
      phone,
      academyId: inputAcademyId,
    } = data;
    if (!name || !email || !password)
      throw new Error("Name, email and password required");

    const ALLOWED: Record<string, string[]> = {
      super_admin: [
        "super_admin",
        "academy_admin",
        "coach",
        "student",
        "parent",
      ],
      academy_admin: ["coach", "student", "parent"],
      coach: ["student"],
    };
    const targetRole = role || "student";
    const allowed = ALLOWED[currentUser.role] || [];
    if (!allowed.includes(targetRole)) {
      throw new Error(
        `${currentUser.role} cannot create ${targetRole} accounts`,
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Email already exists");

    const hash = await bcrypt.hash(password, 10);
    const academyId =
      currentUser.role === "super_admin"
        ? inputAcademyId
        : currentUser.academyId;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hash,
        role: targetRole,
        academy_id: academyId,
        phone: phone || null,
        is_active: true,
        // Auto-assign coach when a coach creates a student
        assigned_coach_id:
          currentUser.role === "coach" && targetRole === "student"
            ? currentUser.id
            : undefined,
      },
    });

    if (batchId) {
      await prisma.batchEnrollment.create({
        data: {
          batch_id: batchId,
          student_id: user.id,
          is_active: true,
        },
      });
    }

    return this.getById(user.id);
  }

  static async linkParent(studentId: string, parentEmail: string) {
    let parent = await prisma.user.findFirst({
      where: { email: parentEmail },
    });

    if (parent && parent.role !== "parent") {
      throw new Error(
        `This email belongs to a ${parent.role} account, not a parent`,
      );
    }

    if (!parent) {
      const student = await this.getById(studentId);
      if (!student) throw new Error("Student not found");

      const hash = await bcrypt.hash("Parent@123", 10);
      const parentName = parentEmail.split("@")[0];

      parent = await prisma.user.create({
        data: {
          name: parentName,
          email: parentEmail,
          password_hash: hash,
          role: "parent",
          academy_id: student.academy_id,
          is_active: true,
        },
      });

      await prisma.parentStudent.create({
        data: {
          parent_id: parent.id,
          student_id: studentId,
        },
      });

      return {
        message: "Parent account created and linked. Temp password: Parent@123",
        parentId: parent.id,
      };
    }

    await prisma.parentStudent.upsert({
      where: {
        parent_id_student_id: { parent_id: parent.id, student_id: studentId },
      },
      update: {},
      create: { parent_id: parent.id, student_id: studentId },
    });

    return { message: "Parent linked successfully" };
  }

  static async updateAvatar(userId: string, avatarBase64: string) {
    if (avatarBase64.length > 500_000) {
      throw new Error("Image too large (max ~350KB)");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarBase64, updated_at: new Date() },
    });
  }

  static async getMyChildren(parentId: string) {
    const relationships = await prisma.parentStudent.findMany({
      where: { parent_id: parentId },
      include: {
        student: {
          include: {
            academy: { select: { name: true } },
            batch_enrollments: {
              where: { is_active: true },
              include: {
                batch: {
                  include: { coach: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    return relationships.map((r) => ({
      id: r.student.id,
      name: r.student.name,
      email: r.student.email,
      rating: r.student.rating,
      avatar: r.student.avatar,
      batch_name: r.student.batch_enrollments[0]?.batch?.name,
      coach_name: r.student.batch_enrollments[0]?.batch?.coach?.name,
      academy_name: r.student.academy?.name,
    }));
  }

  static async getChildrenProgress(parentId: string) {
    const relationships = await prisma.parentStudent.findMany({
      where: { parent_id: parentId },
      include: {
        student: {
          include: {
            _count: {
              select: {
                white_games: { where: { status: "completed" } },
                black_games: { where: { status: "completed" } },
                puzzle_attempts: { where: { is_correct: true } },
                assignment_submissions: {
                  where: { submitted_at: { not: null } },
                },
              },
            },
          },
        },
      },
    });

    // Wins count needs a separate query or raw sql as prisma count with OR on 1:N isn't easy
    // But we can approximate or do multiple counts.
    const results = await Promise.all(
      relationships.map(async (r) => {
        const wins = await prisma.game.count({
          where: {
            status: "completed",
            OR: [
              {
                white_player_id: r.student_id,
                result: { path: ["winner"], equals: "white" },
              },
              {
                black_player_id: r.student_id,
                result: { path: ["winner"], equals: "black" },
              },
            ],
          },
        });

        return {
          id: r.student.id,
          name: r.student.name,
          rating: r.student.rating,
          avatar: r.student.avatar,
          games_played:
            r.student._count.white_games + r.student._count.black_games,
          wins: wins,
          puzzles_solved: r.student._count.puzzle_attempts,
          assignments_done: r.student._count.assignment_submissions,
          assignments_total: await prisma.assignment.count({
            where: {
              OR: [
                { student_id: r.student_id },
                {
                  batch: {
                    enrollments: { some: { student_id: r.student_id } },
                  },
                },
              ],
            },
          }),
        };
      }),
    );

    return results;
  }

  static async getLeaderboard(academyId: string, limit: number = 50) {
    const students = await prisma.user.findMany({
      where: {
        academy_id: academyId,
        role: "student",
        is_active: true,
      },
      orderBy: { rating: "desc" },
      take: limit,
      include: {
        batch_enrollments: {
          where: { is_active: true },
          include: { batch: { select: { name: true } } },
        },
        _count: {
          select: {
            white_games: { where: { status: "completed" } },
            black_games: { where: { status: "completed" } },
          },
        },
      },
    });

    const results = await Promise.all(
      students.map(async (s) => {
        const wins = await prisma.game.count({
          where: {
            status: "completed",
            OR: [
              {
                white_player_id: s.id,
                result: { path: ["winner"], equals: "white" },
              },
              {
                black_player_id: s.id,
                result: { path: ["winner"], equals: "black" },
              },
            ],
          },
        });

        return {
          id: s.id,
          name: s.name,
          avatar: s.avatar,
          rating: s.rating,
          wins: wins,
          games: s._count.white_games + s._count.black_games,
          batch_name: s.batch_enrollments[0]?.batch?.name,
        };
      }),
    );

    return results;
  }

  static async assignCoach(
    studentId: string,
    coachId: string | null,
    academyId: string,
  ) {
    if (coachId) {
      const coach = await prisma.user.findFirst({
        where: { id: coachId, role: "coach", academy_id: academyId },
      });
      if (!coach) throw new Error("Coach not found in this academy");
    }

    await prisma.user.updateMany({
      where: { id: studentId, academy_id: academyId },
      data: { assigned_coach_id: coachId, updated_at: new Date() },
    });
  }

  static async getCoachesWithStudents(academyId: string) {
    const coaches = await prisma.user.findMany({
      where: { role: "coach", academy_id: academyId, is_active: true },
      include: {
        students: {
          where: { is_active: true },
          select: { id: true, name: true, rating: true, avatar: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return coaches.map((c) => ({
      ...c,
      student_count: c.students.length,
    }));
  }
}

export default UserService;
