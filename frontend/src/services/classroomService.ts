import { prisma } from '../lib/prisma';
import { Classroom } from '../types/models';

export class ClassroomService {
  static async getById(id: string) {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        coach: { select: { name: true } },
        batch: { select: { name: true } },
      },
    });

    if (!classroom) return null;

    return {
      ...classroom,
      coach_name: classroom.coach?.name,
      batch_name: classroom.batch?.name,
    };
  }

  static async update(id: string, data: any) {
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

    const updateData: any = {};
    for (const [key, value] of Object.entries(data)) {
      const col = mappings[key];
      if (col && value !== undefined) {
        // Convert empty strings to null for UUID columns
        let finalValue: any = (['coach_id', 'batch_id'].includes(col) && value === '') ? null : value;
        // Convert scheduled_at to a proper Date object for Prisma
        if (col === 'scheduled_at' && finalValue) finalValue = new Date(finalValue as string);
        updateData[col] = finalValue;
      }
    }

    if (Object.keys(updateData).length === 0) return;

    await prisma.classroom.update({
      where: { id },
      data: updateData,
    });
  }

  static async cancel(id: string) {
    await prisma.classroom.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  static async start(id: string) {
    await prisma.classroom.update({
      where: { id },
      data: { status: 'live', started_at: new Date() },
    });
    if ((global as any).io) {
      (global as any).io.to(`classroom:${id}`).emit('classroom:started', { classroomId: id });
    }
  }

  static async end(id: string) {
    await prisma.classroom.update({
      where: { id },
      data: { status: 'completed', ended_at: new Date() },
    });
    if ((global as any).io) {
      (global as any).io.to(`classroom:${id}`).emit('classroom:ended', { classroomId: id });
    }
  }

  static async getAttendance(classroomId: string) {
    const attendance = await prisma.classroomAttendance.findMany({
      where: { classroom_id: classroomId },
      include: {
        student: { select: { name: true, email: true, rating: true } },
      },
      orderBy: { joined_at: 'asc' },
    });

    return attendance.map(a => ({
      ...a,
      student_name: a.student.name,
      email: a.student.email,
      rating: a.student.rating,
    }));
  }

  static async saveBoard(id: string, pgn: string, fen: string) {
    await prisma.classroom.update({
      where: { id },
      data: { pgn, board_fen: fen },
    });
    if ((global as any).io) {
      (global as any).io.to(`classroom:${id}`).emit('board:sync', { pgn, fen });
    }
  }

  static async updateAttendance(classroomId: string, studentId: string, present: boolean) {
    if (present) {
      await prisma.classroomAttendance.upsert({
        where: { classroom_id_student_id: { classroom_id: classroomId, student_id: studentId } },
        create: { classroom_id: classroomId, student_id: studentId, joined_at: new Date(), duration_min: 0 },
        update: { joined_at: new Date() },
      });
    } else {
      await prisma.classroomAttendance.delete({
        where: { classroom_id_student_id: { classroom_id: classroomId, student_id: studentId } },
      }).catch(() => {}); // Ignore if already deleted
    }
  }

  static async bulkAttendance(classroomId: string, present: string[], absent: string[]) {
    // Process presenters
    if (present.length > 0) {
      await prisma.classroomAttendance.createMany({
        data: present.map(studentId => ({
          classroom_id: classroomId,
          student_id: studentId,
          joined_at: new Date(),
          duration_min: 0,
        })),
        skipDuplicates: true,
      });
    }
    
    // Process absentees and notify parents
    const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { title: true } });
    const className = classroom?.title || 'class';

    if (absent.length > 0) {
      await prisma.classroomAttendance.deleteMany({
        where: {
          classroom_id: classroomId,
          student_id: { in: absent },
        },
      });

      // Notification logic - Fetch parents for all absentees
      const studentsWithParents = await prisma.user.findMany({
        where: { id: { in: absent } },
        select: {
          id: true,
          name: true,
          student_of: {
            select: { parent_id: true },
          },
        },
      });

      const notificationsData = [];
      for (const student of studentsWithParents) {
        for (const p of student.student_of) {
          notificationsData.push({
            user_id: p.parent_id,
            type: 'attendance_absent',
            title: 'Attendance Alert',
            body: `${student.name || 'Your child'} was marked absent from "${className}"`,
            data: { studentId: student.id, classroomId } as any,
          });
        }
      }

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData,
        });
      }
    }
  }

  static async create(data: any) {
    const { title, description, coachId, academyId, batchId, scheduledAt, durationMinutes, durationMin } = data;
    const duration = durationMin || durationMinutes || 60;
    
    const classroom = await prisma.classroom.create({
      data: {
        title,
        description,
        coach_id: coachId || null,
        academy_id: academyId || null,
        batch_id: batchId || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt) : new Date(),
        duration_min: duration,
        status: 'scheduled',
      },
    });
    return classroom;
  }

  static async listClassrooms(params: { coachId?: string; academyId?: string }) {
    const { coachId, academyId } = params;
    
    const where: any = {};
    if (coachId) where.coach_id = coachId;
    if (academyId) where.academy_id = academyId;

    const classrooms = await prisma.classroom.findMany({
      where,
      include: {
        batch: { select: { name: true } },
        coach: { select: { name: true } },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      orderBy: { scheduled_at: 'desc' },
      take: 50,
    });

    // To get 'enrolled' count, we need the count of students in the batch
    const batchIds = Array.from(new Set(classrooms.map(c => c.batch_id).filter(Boolean))) as string[];
    const enrollmentCounts = await prisma.batchEnrollment.groupBy({
      by: ['batch_id'],
      where: { batch_id: { in: batchIds }, is_active: true },
      _count: { student_id: true },
    });

    const enrollmentMap = Object.fromEntries(enrollmentCounts.map(ec => [ec.batch_id, ec._count.student_id]));

    return classrooms.map(cl => ({
      ...cl,
      batch_name: cl.batch?.name,
      coach_name: cl.coach?.name,
      enrolled: cl.batch_id ? enrollmentMap[cl.batch_id] || 0 : 0,
      attended: cl._count.attendance,
    }));
  }

  static async getCoachSummary(coachId: string) {
    const classrooms = await prisma.classroom.findMany({
      where: { coach_id: coachId },
      include: {
        batch: { select: { name: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { scheduled_at: 'desc' },
      take: 50,
    });

    const batchIds = Array.from(new Set(classrooms.map(c => c.batch_id).filter(Boolean))) as string[];
    const enrollmentCounts = await prisma.batchEnrollment.groupBy({
      by: ['batch_id'],
      where: { batch_id: { in: batchIds }, is_active: true },
      _count: { student_id: true },
    });

    const enrollmentMap = Object.fromEntries(enrollmentCounts.map(ec => [ec.batch_id, ec._count.student_id]));

    return {
      classes: classrooms.map(cl => ({
        ...cl,
        batch_name: cl.batch?.name,
        enrolled: cl.batch_id ? enrollmentMap[cl.batch_id] || 0 : 0,
        attended: cl._count.attendance,
      }))
    };
  }
}

export default ClassroomService;
