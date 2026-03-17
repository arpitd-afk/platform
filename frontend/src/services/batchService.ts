import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db';

export class BatchService {
  static async listBatches(params: { academyId?: string, coachId?: string, level?: string }) {
    const { academyId, coachId, level } = params;
    const conditions = ['1=1'];
    const queryParams: any[] = [];

    if (academyId) {
      queryParams.push(academyId);
      conditions.push(`b.academy_id=$${queryParams.length}`);
    }
    if (coachId) {
      queryParams.push(coachId);
      conditions.push(`b.coach_id=$${queryParams.length}`);
    }
    if (level) {
      queryParams.push(level);
      conditions.push(`b.level=$${queryParams.length}`);
    }

    const result = await query(
      `SELECT b.*, u.name as coach_name,
        COUNT(DISTINCT be.student_id) as student_count
       FROM batches b
       LEFT JOIN users u ON b.coach_id = u.id
       LEFT JOIN batch_enrollments be ON be.batch_id = b.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY b.id, u.name
       ORDER BY b.created_at DESC`,
      queryParams
    );
    return result.rows;
  }

  static async getById(id: string) {
    const result = await query(
      `SELECT b.*, u.name as coach_name, u.email as coach_email,
        COUNT(DISTINCT be.student_id) as student_count
       FROM batches b
       LEFT JOIN users u ON b.coach_id = u.id
       LEFT JOIN batch_enrollments be ON be.batch_id = b.id
       WHERE b.id = $1 GROUP BY b.id, u.name, u.email`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async createBatch(data: any, academyId: string) {
    const { name, coachId, level = 'beginner', maxStudents = 20, schedule, description } = data;
    const id = uuidv4();
    await query(
      'INSERT INTO batches (id, academy_id, coach_id, name, level, max_students, schedule, description, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())',
      [id, academyId, coachId, name, level, maxStudents, schedule || null, description || null]
    );
    return id;
  }

  static async updateBatch(id: string, data: any) {
    const { name, coachId, level, maxStudents, schedule, description, isActive } = data;
    const sets = [];
    const params = [];

    if (name !== undefined) { params.push(name); sets.push('name=$' + params.length); }
    if (coachId !== undefined) { params.push(coachId); sets.push('coach_id=$' + params.length); }
    if (level !== undefined) { params.push(level); sets.push('level=$' + params.length); }
    if (maxStudents !== undefined) { params.push(maxStudents); sets.push('max_students=$' + params.length); }
    if (schedule !== undefined) { params.push(schedule); sets.push('schedule=$' + params.length); }
    if (description !== undefined) { params.push(description); sets.push('description=$' + params.length); }
    if (isActive !== undefined) { params.push(isActive); sets.push('is_active=$' + params.length); }

    if (sets.length > 0) {
      params.push(id);
      await query('UPDATE batches SET ' + sets.join(', ') + ' WHERE id=$' + params.length, params);
    }
  }

  static async listStudents(batchId: string) {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.rating, u.avatar, be.enrolled_at
       FROM batch_enrollments be
       JOIN users u ON be.student_id = u.id
       WHERE be.batch_id = $1
       ORDER BY u.name ASC`,
      [batchId]
    );
    return result.rows;
  }

  static async enrollStudent(batchId: string, studentId: string) {
    const exists = await query('SELECT id FROM batch_enrollments WHERE batch_id=$1 AND student_id=$2', [batchId, studentId]);
    if (exists.rows.length) throw new Error('Already enrolled');
    await query(
      'INSERT INTO batch_enrollments (id, batch_id, student_id, enrolled_at) VALUES ($1,$2,$3,NOW())',
      [uuidv4(), batchId, studentId]
    );
  }

  static async removeStudent(batchId: string, studentId: string) {
    await query('DELETE FROM batch_enrollments WHERE batch_id=$1 AND student_id=$2', [batchId, studentId]);
  }

  static async getBatchAttendance(batchId: string) {
    const result = await query(
      `SELECT ca.*, c.name as classroom_name, c.scheduled_at, u.name as student_name
       FROM classroom_attendance ca
       JOIN classrooms c ON ca.classroom_id = c.id
       JOIN users u ON ca.student_id = u.id
       WHERE c.batch_id = $1
       ORDER BY c.scheduled_at DESC`,
      [batchId]
    );
    return result.rows;
  }
}

export default BatchService;
