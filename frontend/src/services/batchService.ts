import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class BatchService {
  static async listBatches(params: { academyId?: string, coachId?: string, level?: string }) {
    const { academyId, coachId, level } = params;
    
    const where: Prisma.BatchWhereInput = { is_active: true };
    if (academyId) where.academy_id = academyId;
    if (coachId) where.coach_id = coachId;
    if (level) where.level = level;

    const batches = await prisma.batch.findMany({
      where,
      include: {
        coach: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: { where: { is_active: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return batches.map(b => ({
      ...b,
      coach_name: (b.coach as any)?.name,
      student_count: b._count.enrollments,
    }));
  }

  static async getById(id: string) {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        coach: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: { where: { is_active: true } },
          },
        },
      },
    });

    if (!batch) return null;

    return {
      ...batch,
      coach_name: batch.coach?.name,
      coach_email: batch.coach?.email,
      student_count: batch._count.enrollments,
    };
  }

  static async createBatch(data: any, academyId: string) {
    const { name, coachId, level = 'beginner', maxStudents = 20, schedule, description } = data;
    
    const batch = await prisma.batch.create({
      data: {
        academy_id: academyId,
        coach_id: coachId,
        name,
        level,
        max_students: maxStudents,
        schedule: schedule || null,
        description: description || null,
        is_active: true,
      },
    });

    return batch.id;
  }

  static async updateBatch(id: string, data: any) {
    const { name, coachId, level, maxStudents, schedule, description, isActive } = data;
    
    await prisma.batch.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        coach_id: coachId !== undefined ? coachId : undefined,
        level: level !== undefined ? level : undefined,
        max_students: maxStudents !== undefined ? maxStudents : undefined,
        schedule: schedule !== undefined ? schedule : undefined,
        description: description !== undefined ? description : undefined,
        is_active: isActive !== undefined ? isActive : undefined,
      },
    });
  }

  static async listStudents(batchId: string) {
    const enrollments = await prisma.batchEnrollment.findMany({
      where: { batch_id: batchId, is_active: true },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            rating: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        student: { name: 'asc' },
      },
    });

    return enrollments.map(e => ({
      ...e.student,
      enrolled_at: e.enrolled_at,
    }));
  }

  static async enrollStudent(batchId: string, studentId: string) {
    await prisma.batchEnrollment.upsert({
      where: { batch_id_student_id: { batch_id: batchId, student_id: studentId } },
      update: { is_active: true },
      create: {
        batch_id: batchId,
        student_id: studentId,
        is_active: true,
      },
    });
  }

  static async removeStudent(batchId: string, studentId: string) {
    await prisma.batchEnrollment.update({
      where: { batch_id_student_id: { batch_id: batchId, student_id: studentId } },
      data: { is_active: false },
    });
  }

  static async getBatchAttendance(batchId: string) {
    const attendance = await prisma.classroomAttendance.findMany({
      where: {
        classroom: { batch_id: batchId },
      },
      include: {
        classroom: {
          select: {
            title: true, // using 'title' as 'name' was used in sql
            scheduled_at: true,
          },
        },
        student: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        classroom: { scheduled_at: 'desc' },
      },
    });

    return attendance.map(a => ({
      ...a,
      classroom_name: a.classroom.title,
      scheduled_at: a.classroom.scheduled_at,
      student_name: a.student.name,
    }));
  }
}

export default BatchService;
