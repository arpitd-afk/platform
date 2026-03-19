import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class ContentService {
  static async listLessons(params: { academyId?: string, level?: string, isPublished?: boolean, authorId?: string, search?: string }) {
    const { academyId, level, isPublished, authorId, search } = params;
    const where: Prisma.LessonWhereInput = {};

    if (isPublished !== undefined) {
      where.is_published = isPublished;
    }

    if (authorId) {
      where.author_id = authorId;
    }

    if (academyId) {
      where.OR = [
        { academy_id: academyId },
        { academy_id: null, author: { academy_id: academyId } },
      ];
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        author: { select: { name: true } },
        _count: {
          select: {
            progress: { where: { completed: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Views count needs a separate count if we want total entries in lesson_progress
    return Promise.all(lessons.map(async (l) => {
      const viewsCount = await prisma.lessonProgress.count({
        where: { lesson_id: l.id },
      });

      return {
        ...l,
        author_name: l.author?.name,
        completed_count: l._count.progress,
        views_count: viewsCount,
      };
    }));
  }

  static async getLessonById(id: string, userId?: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        author: { select: { name: true } },
        _count: {
          select: {
            progress: { where: { completed: true } },
          },
        },
      },
    });

    if (!lesson) return null;

    let myProgress = null;
    if (userId) {
      myProgress = await prisma.lessonProgress.findUnique({
        where: { user_id_lesson_id: { user_id: userId, lesson_id: id } },
      });
    }

    return {
      lesson: {
        ...lesson,
        author_name: lesson.author?.name,
        completed_count: lesson._count.progress,
      },
      myProgress,
    };
  }

  static async createLesson(data: any, currentUser: any) {
    const {
      title, description, pgn = '', videoUrl = '', level = 'beginner',
      tags = [], content = {}, isPublished = false, thumbnailUrl = ''
    } = data;

    const lesson = await prisma.lesson.create({
      data: {
        academy_id: currentUser.academyId,
        author_id: currentUser.id,
        title,
        description,
        pgn,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        level,
        tags,
        content: content || {},
        is_published: isPublished,
      },
    });
    return lesson.id;
  }

  static async updateLesson(id: string, data: any, currentUser: { id: string, role: string }) {
    const {
      title, description, pgn, videoUrl, thumbnailUrl,
      level, tags, content, isPublished
    } = data;

    const where: Prisma.LessonWhereUniqueInput = { id };
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'academy_admin') {
      (where as any).author_id = currentUser.id;
    }

    await prisma.lesson.update({
      where,
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        pgn: pgn !== undefined ? pgn : undefined,
        video_url: videoUrl !== undefined ? videoUrl : undefined,
        thumbnail_url: thumbnailUrl !== undefined ? thumbnailUrl : undefined,
        level: level !== undefined ? level : undefined,
        tags: tags !== undefined ? tags : undefined,
        content: content !== undefined ? content : undefined,
        is_published: isPublished !== undefined ? isPublished : undefined,
        updated_at: new Date(),
      },
    });
  }

  static async deleteLesson(id: string, currentUser: { id: string, role: string }) {
    const where: Prisma.LessonWhereUniqueInput = { id };
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'academy_admin') {
      (where as any).author_id = currentUser.id;
    }

    await prisma.lesson.delete({ where });
  }

  static async completeLesson(lessonId: string, userId: string) {
    await prisma.lessonProgress.upsert({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
      update: { completed: true, watched_at: new Date() },
      create: {
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        watched_at: new Date(),
      },
    });
  }

  static async getProgress(userId: string) {
    return prisma.lessonProgress.findMany({
      where: { user_id: userId },
      select: {
        lesson_id: true,
        completed: true,
        watched_at: true,
      },
    });
  }

  static async listCourses(academyId: string, currentUser: { role: string }) {
    const where: Prisma.CourseWhereInput = { academy_id: academyId };
    if (currentUser.role === 'student') {
      where.is_published = true;
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return courses.map((c) => ({
      ...c,
      lesson_count: c._count.lessons,
    }));
  }

  static async createCourse(data: any, currentUser: any) {
    const { title, description, level = 'beginner', isPublished = false } = data;
    const course = await prisma.course.create({
      data: {
        academy_id: currentUser.academyId,
        title,
        description,
        level,
        is_published: isPublished,
      },
    });
    return course.id;
  }

  static async addLessonToCourse(courseId: string, lessonId: string, orderIndex: number = 0) {
    await prisma.courseLesson.upsert({
      where: { course_id_lesson_id: { course_id: courseId, lesson_id: lessonId } },
      update: { order_index: orderIndex },
      create: {
        course_id: courseId,
        lesson_id: lessonId,
        order_index: orderIndex,
      },
    });
  }
}

export default ContentService;
