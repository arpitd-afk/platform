import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db';

export class ContentService {
  static async listLessons(params: { academyId?: string, level?: string, isPublished?: boolean, authorId?: string, search?: string }) {
    const { academyId, level, isPublished, authorId, search } = params;
    const conditions = [];
    const queryParams: any[] = [];

    if (isPublished !== undefined) {
      queryParams.push(isPublished);
      conditions.push(`l.is_published = $${queryParams.length}`);
    }

    if (authorId) {
      queryParams.push(authorId);
      conditions.push(`l.author_id = $${queryParams.length}`);
    }

    if (academyId) {
      queryParams.push(academyId);
      conditions.push(`(l.academy_id = $${queryParams.length} OR (l.academy_id IS NULL AND l.author_id IN (SELECT id FROM users WHERE academy_id = $${queryParams.length})))`);
    }

    if (level) {
      queryParams.push(level);
      conditions.push(`l.level = $${queryParams.length}`);
    }

    if (search) {
      queryParams.push(`%${search}%`);
      conditions.push(`(l.title ILIKE $${queryParams.length} OR l.description ILIKE $${queryParams.length})`);
    }

    const result = await query(
      `SELECT l.*, u.name as author_name,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.lesson_id = l.id AND lp.completed = true) as completed_count,
        (SELECT COUNT(*) FROM lesson_progress lp2 WHERE lp2.lesson_id = l.id) as views_count
       FROM lessons l
       LEFT JOIN users u ON l.author_id = u.id
       WHERE ${conditions.length ? conditions.join(' AND ') : '1=1'}
       ORDER BY l.created_at DESC`,
      queryParams
    );
    return result.rows;
  }

  static async getLessonById(id: string, userId?: string) {
    const result = await query(
      `SELECT l.*, u.name as author_name,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.lesson_id = l.id AND lp.completed = true) as completed_count
       FROM lessons l
       LEFT JOIN users u ON l.author_id = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (!result.rows.length) return null;

    let myProgress = null;
    if (userId) {
      const p = await query(
        'SELECT * FROM lesson_progress WHERE user_id=$1 AND lesson_id=$2',
        [userId, id]
      );
      myProgress = p.rows[0] || null;
    }

    return { lesson: result.rows[0], myProgress };
  }

  static async createLesson(data: any, currentUser: any) {
    const {
      title, description, pgn = '', videoUrl = '', level = 'beginner',
      tags = [], content = {}, isPublished = false, thumbnailUrl = ''
    } = data;

    const id = uuidv4();
    await query(
      `INSERT INTO lessons
        (id, academy_id, author_id, title, description, pgn, video_url, thumbnail_url,
         level, tags, content, is_published, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
      [id, currentUser.academyId, currentUser.id, title, description, pgn,
        videoUrl, thumbnailUrl, level, tags, JSON.stringify(content), isPublished]
    );
    return id;
  }

  static async updateLesson(id: string, data: any, currentUser: any) {
    const {
      title, description, pgn, videoUrl, thumbnailUrl,
      level, tags, content, isPublished
    } = data;

    await query(
      `UPDATE lessons SET
        title         = COALESCE($1, title),
        description   = COALESCE($2, description),
        pgn           = COALESCE($3, pgn),
        video_url     = COALESCE($4, video_url),
        thumbnail_url = COALESCE($5, thumbnail_url),
        level         = COALESCE($6, level),
        tags          = COALESCE($7, tags),
        content       = COALESCE($8, content),
        is_published  = COALESCE($9, is_published),
        updated_at    = NOW()
       WHERE id = $10 AND (author_id = $11 OR $12 = 'academy_admin' OR $12 = 'super_admin')`,
      [title, description, pgn, videoUrl, thumbnailUrl,
        level, tags, content ? JSON.stringify(content) : null,
        isPublished, id, currentUser.id, currentUser.role]
    );
  }

  static async deleteLesson(id: string, currentUser: any) {
    await query(
      "DELETE FROM lessons WHERE id=$1 AND (author_id=$2 OR $3='super_admin' OR $3='academy_admin')",
      [id, currentUser.id, currentUser.role]
    );
  }

  static async completeLesson(lessonId: string, userId: string) {
    await query(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, watched_at)
       VALUES ($1,$2,true,NOW())
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET completed=true, watched_at=NOW()`,
      [userId, lessonId]
    );
  }

  static async getProgress(userId: string) {
    const result = await query(
      'SELECT lesson_id, completed, watched_at FROM lesson_progress WHERE user_id=$1',
      [userId]
    );
    return result.rows;
  }

  static async listCourses(academyId: string, currentUser: any) {
    const params = [academyId];
    const conditions = ['c.academy_id = $1'];
    if (currentUser.role === 'student') {
      conditions.push('c.is_published = true');
    }

    const result = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM course_lessons WHERE course_id = c.id) as lesson_count
       FROM courses c
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.created_at DESC`,
      params
    );
    return result.rows;
  }

  static async createCourse(data: any, currentUser: any) {
    const { title, description, level = 'beginner', isPublished = false } = data;
    const id = uuidv4();
    await query(
      `INSERT INTO courses (id, academy_id, title, description, level, is_published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [id, currentUser.academyId, title, description, level, isPublished]
    );
    return id;
  }

  static async addLessonToCourse(courseId: string, lessonId: string, orderIndex: number = 0) {
    await query(
      'INSERT INTO course_lessons (course_id, lesson_id, order_index) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [courseId, lessonId, orderIndex]
    );
  }
}

export default ContentService;
