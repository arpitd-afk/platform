import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db';
import { Classroom } from '../types/models';

export class ClassroomService {
  static async getById(id: string) {
    const result = await query(
      `SELECT c.*, u.name as coach_name, b.name as batch_name
       FROM classrooms c
       LEFT JOIN users u ON c.coach_id = u.id
       LEFT JOIN batches b ON c.batch_id = b.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id: string, data: any) {
    const fields = [];
    const vals = [];
    
    const mappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      scheduledAt: 'scheduled_at',
      scheduled_at: 'scheduled_at',
      durationMinutes: 'duration_min',
      duration_min: 'duration_min',
      coachId: 'coach_id',
      coach_id: 'coach_id',
      batchId: 'batch_id',
      batch_id: 'batch_id',
      status: 'status'
    };

    for (const [key, value] of Object.entries(data)) {
      const col = mappings[key];
      if (col && value !== undefined) {
        // Convert empty strings to null for UUID columns
        const finalValue = (['coach_id', 'batch_id'].includes(col) && value === '') ? null : value;
        vals.push(finalValue);
        fields.push(`${col} = $${vals.length}`);
      }
    }

    if (fields.length === 0) return;

    vals.push(id);
    await query(
      `UPDATE classrooms SET ${fields.join(', ')} WHERE id = $${vals.length}`,
      vals
    );
  }

  static async cancel(id: string) {
    await query("UPDATE classrooms SET status = 'cancelled' WHERE id = $1", [id]);
  }

  static async start(id: string) {
    await query("UPDATE classrooms SET status = 'live', started_at = NOW() WHERE id = $1", [id]);
    if ((global as any).io) {
      (global as any).io.to(`classroom:${id}`).emit('classroom:started', { classroomId: id });
    }
  }

  static async end(id: string) {
    await query("UPDATE classrooms SET status = 'completed', ended_at = NOW() WHERE id = $1", [id]);
    if ((global as any).io) {
      (global as any).io.to(`classroom:${id}`).emit('classroom:ended', { classroomId: id });
    }
  }

  static async getAttendance(classroomId: string) {
    const result = await query(
      `SELECT ca.*, u.name as student_name, u.email, u.rating
       FROM classroom_attendance ca
       JOIN users u ON ca.student_id = u.id
       WHERE ca.classroom_id = $1 ORDER BY ca.joined_at ASC`,
      [classroomId]
    );
    return result.rows;
  }

  static async saveBoard(id: string, pgn: string, fen: string) {
    await query('UPDATE classrooms SET pgn = $1, board_fen = $2 WHERE id = $3', [pgn, fen, id]);
    if ((global as any).io) {
      (global as any).io.to(`classroom:${id}`).emit('board:sync', { pgn, fen });
    }
  }

  static async updateAttendance(classroomId: string, studentId: string, present: boolean) {
    if (present) {
      await query(
        `INSERT INTO classroom_attendance (classroom_id, student_id, joined_at, duration_min)
         VALUES ($1, $2, NOW(), 0)
         ON CONFLICT (classroom_id, student_id) DO UPDATE SET joined_at = NOW()`,
        [classroomId, studentId]
      );
    } else {
      await query(
        'DELETE FROM classroom_attendance WHERE classroom_id = $1 AND student_id = $2',
        [classroomId, studentId]
      );
    }
  }

  static async bulkAttendance(classroomId: string, present: string[], absent: string[]) {
    for (const studentId of present) {
      await query(
        `INSERT INTO classroom_attendance (classroom_id, student_id, joined_at, duration_min)
         VALUES ($1, $2, NOW(), 0) ON CONFLICT (classroom_id, student_id) DO NOTHING`,
        [classroomId, studentId]
      );
    }
    
    // Process abentees and notify parents
    const classResult = await query('SELECT title FROM classrooms WHERE id=$1', [classroomId]);
    const className = classResult.rows[0]?.title || 'class';

    for (const studentId of absent) {
      await query(
        'DELETE FROM classroom_attendance WHERE classroom_id = $1 AND student_id = $2',
        [classroomId, studentId]
      );

      // Notification logic
      const parents = await query('SELECT parent_id FROM parent_student WHERE student_id=$1', [studentId]);
      const student = await query('SELECT name FROM users WHERE id=$1', [studentId]);
      
      for (const p of parents.rows) {
        await query(
          `INSERT INTO notifications (id, user_id, type, title, body, data)
           VALUES (gen_random_uuid(), $1, 'attendance_absent', $2, $3, $4)`,
          [p.parent_id, 'Attendance Alert', 
           `${student.rows[0]?.name || 'Your child'} was marked absent from "${className}"`,
           JSON.stringify({ studentId, classroomId })]
        );
      }
    }
  }

  static async create(data: any) {
    const { title, description, coachId, academyId, batchId, scheduledAt, durationMinutes, durationMin } = data;
    const duration = durationMin || durationMinutes || 60;
    const result = await query(
      `INSERT INTO classrooms (id, title, description, coach_id, academy_id, batch_id, scheduled_at, duration_min, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', NOW())
       RETURNING id`,
      [uuidv4(), title, description, coachId || null, academyId || null, batchId || null, scheduledAt, duration]
    );
    return result.rows[0];
  }

  static async listClassrooms(params: { coachId?: string; academyId?: string }) {
    const { coachId, academyId } = params;
    const conditions = [];
    const queryParams: any[] = [];

    if (coachId) {
      queryParams.push(coachId);
      conditions.push(`cl.coach_id = $${queryParams.length}`);
    }
    if (academyId) {
      queryParams.push(academyId);
      conditions.push(`b.academy_id = $${queryParams.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT cl.id, cl.title, cl.description, cl.scheduled_at, cl.status, cl.batch_id, cl.coach_id, cl.duration_min,
        b.name as batch_name, u.name as coach_name,
        COUNT(DISTINCT be.student_id) as enrolled,
        COUNT(DISTINCT ca.student_id) as attended
       FROM classrooms cl
       LEFT JOIN batches b ON b.id = cl.batch_id
       LEFT JOIN users u ON u.id = cl.coach_id
       LEFT JOIN batch_enrollments be ON be.batch_id = cl.batch_id AND be.is_active = true
       LEFT JOIN classroom_attendance ca ON ca.classroom_id = cl.id
       ${where}
       GROUP BY cl.id, cl.title, cl.description, cl.scheduled_at, cl.status, cl.batch_id, cl.coach_id, cl.duration_min, b.name, u.name
       ORDER BY cl.scheduled_at DESC LIMIT 50`,
      queryParams
    );
    return result.rows;
  }

  static async getCoachSummary(coachId: string) {
    const result = await query(
      `SELECT cl.id, cl.title, cl.scheduled_at, cl.status, cl.batch_id, cl.duration_min,
        b.name as batch_name,
        COUNT(DISTINCT be.student_id) as enrolled,
        COUNT(DISTINCT ca.student_id) as attended
       FROM classrooms cl
       LEFT JOIN batches b ON b.id = cl.batch_id
       LEFT JOIN batch_enrollments be ON be.batch_id = cl.batch_id AND be.is_active = true
       LEFT JOIN classroom_attendance ca ON ca.classroom_id = cl.id
       WHERE cl.coach_id = $1
       GROUP BY cl.id, cl.title, cl.scheduled_at, cl.status, cl.batch_id, cl.duration_min, b.name
       ORDER BY cl.scheduled_at DESC LIMIT 50`,
      [coachId]
    );
    return { classes: result.rows };
  }
}

export default ClassroomService;
