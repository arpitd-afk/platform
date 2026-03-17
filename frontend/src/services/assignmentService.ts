import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db';

export class AssignmentService {
  static async listAssignments(params: { studentId?: string, batchId?: string }, currentUser: any) {
    const { studentId, batchId } = params;
    const conditions = [];
    const queryParams: any[] = [];

    if (studentId) {
      queryParams.push(studentId);
      conditions.push(`(a.student_id=$${queryParams.length} OR a.batch_id IN (SELECT batch_id FROM batch_enrollments WHERE student_id=$${queryParams.length}))`);
    }

    if (batchId) {
      queryParams.push(batchId);
      conditions.push(`a.batch_id=$${queryParams.length}`);
    }

    const studentCtx = studentId || (currentUser.role === 'student' ? currentUser.id : null);
    let subSelect = '';
    let subJoin = '';
    if (studentCtx) {
      queryParams.push(studentCtx);
      const pIdx = queryParams.length;
      subSelect = `, sub.submitted_at, sub.graded_at, sub.score as grade, sub.feedback, sub.submission`;
      subJoin = `LEFT JOIN LATERAL (
        SELECT sub2.submitted_at, sub2.graded_at, sub2.score, sub2.feedback, sub2.submission
        FROM assignment_submissions sub2
        WHERE sub2.assignment_id = a.id AND sub2.student_id = $${pIdx}
        ORDER BY sub2.submitted_at DESC LIMIT 1
      ) sub ON true`;
    }

    const result = await query(
      `SELECT a.id, a.title, a.description, a.type, a.due_date, a.content,
              a.coach_id, a.batch_id, a.student_id, a.passing_score, a.max_attempts,
              a.created_at, u.name as coach_name,
              (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id) as total_submissions,
              (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id AND graded_at IS NOT NULL) as graded_count
              ${subSelect}
       FROM assignments a
       LEFT JOIN users u ON a.coach_id = u.id
       ${subJoin}
       ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
       ORDER BY a.created_at DESC`,
      queryParams
    );

    return result.rows;
  }

  static async createAssignment(data: any, currentUser: any) {
    const { title, description, type, batchId, studentId, dueDate, content } = data;
    const id = uuidv4();
    await query(
      'INSERT INTO assignments (id, coach_id, batch_id, student_id, title, description, type, due_date, content, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())',
      [id, currentUser.id, batchId || null, studentId || null, title, description, type || 'puzzle', dueDate, JSON.stringify(content || {})]
    );

    // Notifications
    try {
      if (studentId) {
        await query(
          "INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, 'assignment', $2, $3, NOW())",
          [studentId, `New Assignment: ${title}`, description ? description.slice(0, 100) : 'Check your new assignment.']
        );
      } else if (batchId) {
        const batchStudents = await query('SELECT student_id FROM batch_enrollments WHERE batch_id=$1 AND is_active=true', [batchId]);
        for (const s of batchStudents.rows) {
          await query(
            "INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, 'assignment', $2, $3, NOW())",
            [s.student_id, `New Assignment: ${title}`, description ? description.slice(0, 100) : 'Check your new assignment.']
          );
        }
      }
    } catch (err: any) {
      console.error('[Assignments Notif Error]', err.message);
    }

    return id;
  }

  static async submitAssignment(assignmentId: string, studentId: string, submission: any) {
    const id = uuidv4();
    const attempt = await query(
      'SELECT COUNT(*)+1 as num FROM assignment_submissions WHERE assignment_id=$1 AND student_id=$2',
      [assignmentId, studentId]
    );
    await query(
      'INSERT INTO assignment_submissions (id, assignment_id, student_id, attempt_number, submission, submitted_at) VALUES ($1,$2,$3,$4,$5,NOW())',
      [id, assignmentId, studentId, parseInt(attempt.rows[0].num), JSON.stringify(submission)]
    );
    return id;
  }

  static async getSubmissions(assignmentId: string) {
    const result = await query(
      `SELECT s.id, s.assignment_id, s.student_id, s.attempt_number, s.submission, 
              s.score as grade, s.feedback, s.graded_by, s.submitted_at, s.graded_at,
              u.name as student_name, u.avatar as student_avatar
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );
    return result.rows;
  }

  static async getAssignment(id: string, currentUser: any) {
    const result = await query(
      `SELECT a.*,
        u.name as coach_name,
        b.name as batch_name,
        s.name as student_name,
        (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id) as total_submissions,
        (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id AND graded_at IS NOT NULL) as graded_count
       FROM assignments a
       LEFT JOIN users u ON a.coach_id = u.id
       LEFT JOIN batches b ON a.batch_id = b.id
       LEFT JOIN users s ON a.student_id = s.id
       WHERE a.id = $1`,
      [id]
    );

    if (!result.rows.length) return null;

    let mySubmission = null;
    if (currentUser.role === 'student') {
      const sub = await query(
        `SELECT id, assignment_id, student_id, attempt_number, submission, 
                score as grade, feedback, graded_by, submitted_at, graded_at
         FROM assignment_submissions
         WHERE assignment_id=$1 AND student_id=$2
         ORDER BY submitted_at DESC LIMIT 1`,
        [id, currentUser.id]
      );
      mySubmission = sub.rows[0] || null;
    }

    return { assignment: result.rows[0], mySubmission };
  }

  static async updateAssignment(id: string, data: any, currentUser: any) {
    const { title, description, type, dueDate, content, passingScore, maxAttempts } = data;
    await query(
      `UPDATE assignments SET
        title        = COALESCE($1, title),
        description  = COALESCE($2, description),
        type         = COALESCE($3, type),
        due_date     = COALESCE($4, due_date),
        content      = COALESCE($5, content),
        passing_score = COALESCE($6, passing_score),
        max_attempts  = COALESCE($7, max_attempts)
       WHERE id = $8 AND coach_id = $9`,
      [title, description, type, dueDate, content, passingScore, maxAttempts, id, currentUser.id]
    );
  }

  static async deleteAssignment(id: string, currentUser: any) {
    await query(
      'DELETE FROM assignments WHERE id=$1 AND coach_id=$2',
      [id, currentUser.id]
    );
  }

  static async gradeSubmission(submissionId: string, coachId: string, score: number, feedback: string) {
    await query(
      'UPDATE assignment_submissions SET score = $1, feedback = $2, graded_by = $3, graded_at = NOW() WHERE id = $4',
      [score, feedback, coachId, submissionId]
    );
  }
}

export default AssignmentService;
