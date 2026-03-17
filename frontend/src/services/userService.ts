import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query } from "../lib/db";
import { User } from "../types/models";

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
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const queryParams: any[] = [];

    if (currentUser.role === "super_admin") {
      if (status === "active") conditions.push("u.is_active = true");
      else if (status === "inactive") conditions.push("u.is_active = false");
      if (academyId) {
        queryParams.push(academyId);
        conditions.push(`u.academy_id = $${queryParams.length}`);
      }
    } else {
      conditions.push("u.is_active = true");
      const targetAcademy = academyId || currentUser.academyId;
      if (targetAcademy) {
        queryParams.push(targetAcademy);
        conditions.push(`u.academy_id = $${queryParams.length}`);
      }
      // If coach, only show their students by default
      if (currentUser.role === "coach") {
        queryParams.push(currentUser.id);
        conditions.push(`u.assigned_coach_id = $${queryParams.length}`);
      }
    }

    if (role) {
      queryParams.push(role);
      conditions.push(`u.role = $${queryParams.length}`);
    }

    queryParams.push(limit, offset);
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.rating, u.avatar, u.phone,
              u.is_active, u.last_login_at, u.created_at, u.assigned_coach_id,
              u.academy_id,
              a.name as academy_name,
              c.name as assigned_coach_name, c.avatar as assigned_coach_avatar,
              be.batch_id, b.name as batch_name,
              json_agg(json_build_object('name', p.name, 'email', p.email)) FILTER (WHERE p.id IS NOT NULL) as parents,
              (SELECT COUNT(*) FROM games g WHERE (g.white_player_id = u.id OR g.black_player_id = u.id) AND g.status = 'completed') as games_played
       FROM users u
       LEFT JOIN academies a ON a.id = u.academy_id
       LEFT JOIN users c ON c.id = u.assigned_coach_id
       LEFT JOIN batch_enrollments be ON be.student_id = u.id AND be.is_active = true
       LEFT JOIN batches b ON b.id = be.batch_id
       LEFT JOIN parent_student ps ON ps.student_id = u.id
       LEFT JOIN users p ON p.id = ps.parent_id
       ${conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""}
       GROUP BY u.id, a.name, c.id, be.batch_id, b.id
       ORDER BY u.name ASC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams,
    );

    return result.rows;
  }

  static async getById(id: string) {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.rating, u.avatar, u.bio, u.created_at, u.is_active, u.phone, u.assigned_coach_id, u.academy_id,
        a.name as academy_name
       FROM users u LEFT JOIN academies a ON u.academy_id = a.id WHERE u.id = $1`,
      [id],
    );
    return result.rows[0] || null;
  }

  static async update(id: string, data: any, currentUser: any) {
    const isSelf = currentUser.id === id;
    const isAdmin = ["super_admin", "academy_admin"].includes(currentUser.role);
    if (!isSelf && !isAdmin) throw new Error("Not authorized");

    const { name, bio, phone, is_active, batch_id } = data;
    const fields = [];
    const vals = [];

    if (name !== undefined) {
      vals.push(name);
      fields.push("name=$" + vals.length);
    }
    if (bio !== undefined) {
      vals.push(bio);
      fields.push("bio=$" + vals.length);
    }
    if (phone !== undefined) {
      vals.push(phone);
      fields.push("phone=$" + vals.length);
    }
    if (is_active !== undefined && isAdmin) {
      vals.push(is_active);
      fields.push("is_active=$" + vals.length);
    }

    if (fields.length > 0) {
      vals.push(id);
      await query(
        "UPDATE users SET " +
          fields.join(",") +
          ", updated_at=NOW() WHERE id=$" +
          vals.length,
        vals,
      );
    }

    if (batch_id !== undefined && isAdmin) {
      await query(
        "UPDATE batch_enrollments SET is_active=false WHERE student_id=$1",
        [id],
      );
      if (batch_id) {
        await query(
          "INSERT INTO batch_enrollments (batch_id, student_id, enrolled_at, is_active) VALUES ($1,$2,NOW(),true) ON CONFLICT (batch_id, student_id) DO UPDATE SET is_active=true",
          [batch_id, id],
        );
      }
    }

    return this.getById(id);
  }

  static async getStats(id: string) {
    const [games, puzzles, user] = await Promise.all([
      query(
        `SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE (result->>'winner'='white' AND white_player_id=$1) OR (result->>'winner'='black' AND black_player_id=$1)) as wins
        FROM games WHERE (white_player_id=$1 OR black_player_id=$1) AND status='completed'`,
        [id],
      ),
      query(
        "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_correct) as correct FROM puzzle_attempts WHERE user_id=$1",
        [id],
      ),
      query("SELECT rating, role FROM users WHERE id=$1", [id]),
    ]);

    const stats: any = {
      rating: user.rows[0]?.rating,
      games: games.rows[0],
      puzzles: puzzles.rows[0],
    };

    if (user.rows[0]?.role === "coach") {
      const [students, classes] = await Promise.all([
        query(
          `
          SELECT COUNT(DISTINCT student_id) as total
          FROM (
            SELECT id as student_id FROM users WHERE assigned_coach_id = $1
            UNION
            SELECT be.student_id FROM batch_enrollments be
            JOIN batches b ON be.batch_id = b.id
            WHERE b.coach_id = $1 AND be.is_active = true
          ) as all_students`,
          [id],
        ),
        query(
          "SELECT COUNT(*) as total FROM classrooms WHERE coach_id = $1 AND status = 'completed'",
          [id],
        ),
      ]);
      stats.students = parseInt(students.rows[0]?.total || "0", 10);
      stats.classes = parseInt(classes.rows[0]?.total || "0", 10);
    }

    return stats;
  }

  static async getRatingHistory(userId: string, limit: number = 30) {
    const result = await query(
      "SELECT rating, recorded_at as date FROM rating_history WHERE user_id=$1 ORDER BY recorded_at ASC LIMIT $2",
      [userId, limit],
    );
    return result.rows;
  }

  static async getAttendance(userId: string, limit: number = 60) {
    const result = await query(
      `SELECT cl.id as classroom_id, cl.title as class_title, cl.scheduled_at, cl.status as class_status,
        cl.duration_min, b.name as batch_name,
        CASE WHEN ca.student_id IS NOT NULL THEN 'present' ELSE 'absent' END as status,
        ca.joined_at, ca.duration_min as actual_duration_min
       FROM classrooms cl
       LEFT JOIN batches b ON b.id = cl.batch_id
       LEFT JOIN batch_enrollments be ON be.batch_id = cl.batch_id AND be.student_id = $1 AND be.is_active = true
       LEFT JOIN classroom_attendance ca ON ca.classroom_id = cl.id AND ca.student_id = $1
       WHERE (cl.status = 'completed' OR cl.status = 'live')
         AND (be.student_id = $1 OR ca.student_id = $1)
       ORDER BY cl.scheduled_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  static async getGames(userId: string, limit: number = 20) {
    const result = await query(
      `SELECT g.*,
        w.name as white_name, b.name as black_name,
        w.rating as white_rating, b.rating as black_rating
       FROM games g
       LEFT JOIN users w ON g.white_player_id = w.id
       LEFT JOIN users b ON g.black_player_id = b.id
       WHERE (g.white_player_id=$1 OR g.black_player_id=$1) AND g.status='completed'
       ORDER BY g.created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
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

    const exists = await query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length > 0) throw new Error("Email already exists");

    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const academyId =
      currentUser.role === "super_admin"
        ? inputAcademyId
        : currentUser.academyId;

    await query(
      "INSERT INTO users (id, name, email, password_hash, role, academy_id, phone, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW())",
      [userId, name, email, hash, targetRole, academyId, phone || null],
    );

    if (batchId) {
      await query(
        "INSERT INTO batch_enrollments (batch_id, student_id, enrolled_at, is_active) VALUES ($1,$2,NOW(),true) ON CONFLICT (batch_id, student_id) DO NOTHING",
        [batchId, userId],
      );
    }

    return this.getById(userId);
  }

  static async linkParent(studentId: string, parentEmail: string) {
    const parent = await query(
      `SELECT id FROM users WHERE email=$1 AND role='parent'`,
      [parentEmail],
    );
    if (parent.rows.length === 0) {
      // Create parent account automatically
      const parentId = uuidv4();
      const hash = await bcrypt.hash("Parent@123", 10);
      const student = await this.getById(studentId);
      if (!student) throw new Error("Student not found");

      const parentName = parentEmail.split("@")[0];
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, academy_id, is_active, created_at)
         VALUES ($1,$2,$3,$4,'parent',$5,true,NOW())`,
        [parentId, parentName, parentEmail, hash, student.academy_id],
      );
      await query(
        "INSERT INTO parent_student (parent_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [parentId, studentId],
      );
      return {
        message: "Parent account created and linked. Temp password: Parent@123",
        parentId,
      };
    }

    await query(
      "INSERT INTO parent_student (parent_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [parent.rows[0].id, studentId],
    );
    return { message: "Parent linked successfully" };
  }

  static async updateAvatar(userId: string, avatarBase64: string) {
    if (avatarBase64.length > 500_000) {
      throw new Error("Image too large (max ~350KB)");
    }
    await query(
      "UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2",
      [avatarBase64, userId],
    );
  }

  static async getMyChildren(parentId: string) {
    const result = await query(
      `SELECT DISTINCT ON (u.id)
        u.id, u.name, u.email, u.rating, u.avatar,
        b.name as batch_name, c.name as coach_name, a.name as academy_name
       FROM parent_student ps
       JOIN users u ON ps.student_id = u.id
       LEFT JOIN batch_enrollments be ON be.student_id = u.id AND be.is_active = true
       LEFT JOIN batches b ON be.batch_id = b.id
       LEFT JOIN users c ON b.coach_id = c.id
       LEFT JOIN academies a ON u.academy_id = a.id
       WHERE ps.parent_id = $1
       ORDER BY u.id, b.name`,
      [parentId],
    );
    return result.rows;
  }

  static async getChildrenProgress(parentId: string) {
    const result = await query(
      `SELECT u.id, u.name, u.rating, u.avatar,
        COUNT(DISTINCT g.id) as games_played,
        COUNT(DISTINCT g.id) FILTER (WHERE (g.white_player_id=u.id AND (g.result->>'winner')='white') OR (g.black_player_id=u.id AND (g.result->>'winner')='black')) as wins,
        COUNT(DISTINCT pa.id) FILTER (WHERE pa.is_correct) as puzzles_solved,
        COUNT(DISTINCT asub.id) as assignments_done,
        COUNT(DISTINCT a.id) as assignments_total
       FROM parent_student ps
       JOIN users u ON ps.student_id = u.id
       LEFT JOIN games g ON g.white_player_id=u.id OR g.black_player_id=u.id
       LEFT JOIN puzzle_attempts pa ON pa.user_id=u.id
       LEFT JOIN assignment_submissions asub ON asub.student_id=u.id AND asub.submitted_at IS NOT NULL
       LEFT JOIN assignments a ON a.id=asub.assignment_id
       WHERE ps.parent_id=$1
       GROUP BY u.id, u.name, u.rating, u.avatar`,
      [parentId],
    );
    return result.rows;
  }

  static async getLeaderboard(academyId: string, limit: number = 50) {
    const result = await query(
      `SELECT u.id, u.name, u.avatar, u.rating,
        COUNT(g.id) FILTER (WHERE (g.result->>'winner') IS NOT NULL AND (g.white_player_id=u.id OR g.black_player_id=u.id)) as wins,
        COUNT(g.id) as games,
        MAX(b.name) as batch_name
       FROM users u
       LEFT JOIN games g ON g.white_player_id=u.id OR g.black_player_id=u.id
       LEFT JOIN batch_enrollments be ON be.student_id=u.id AND be.is_active=true
       LEFT JOIN batches b ON b.id=be.batch_id
       WHERE u.academy_id=$1 AND u.role='student' AND u.is_active=true
       GROUP BY u.id, u.name, u.avatar, u.rating
       ORDER BY u.rating DESC LIMIT $2`,
      [academyId, limit],
    );
    return result.rows;
  }

  static async assignCoach(
    studentId: string,
    coachId: string | null,
    academyId: string,
  ) {
    if (coachId) {
      const coach = await query(
        "SELECT id FROM users WHERE id=$1 AND role='coach' AND academy_id=$2",
        [coachId, academyId],
      );
      if (!coach.rows.length)
        throw new Error("Coach not found in this academy");
    }

    await query(
      "UPDATE users SET assigned_coach_id=$1, updated_at=NOW() WHERE id=$2 AND academy_id=$3",
      [coachId, studentId, academyId],
    );
  }

  static async getCoachesWithStudents(academyId: string) {
    const result = await query(
      `SELECT c.id, c.name, c.email, c.avatar, c.rating,
         COUNT(s.id) as student_count,
         json_agg(json_build_object('id', s.id, 'name', s.name, 'rating', s.rating, 'avatar', s.avatar)
           ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL) as students
       FROM users c
       LEFT JOIN users s ON s.assigned_coach_id = c.id AND s.is_active = true
       WHERE c.role = 'coach' AND c.academy_id = $1 AND c.is_active = true
       GROUP BY c.id
       ORDER BY c.name`,
      [academyId],
    );
    return result.rows;
  }
}

export default UserService;
