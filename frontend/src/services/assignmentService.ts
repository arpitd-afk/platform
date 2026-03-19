import { prisma } from '../lib/prisma';

export class AssignmentService {
  static async listAssignments(params: { studentId?: string, batchId?: string }, currentUser: any) {
    const { studentId, batchId } = params;
    
    const where: any = {};
    if (batchId) {
      where.batch_id = batchId;
    }
    if (studentId) {
      where.OR = [
        { student_id: studentId },
        { batch: { enrollments: { some: { student_id: studentId, is_active: true } } } }
      ];
    } else if (currentUser.role === 'student') {
      where.OR = [
        { student_id: currentUser.id },
        { batch: { enrollments: { some: { student_id: currentUser.id, is_active: true } } } }
      ];
    }

    const studentCtx = studentId || (currentUser.role === 'student' ? currentUser.id : null);

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        coach: { select: { name: true } },
        batch: { select: { name: true } },
        submissions: studentCtx ? {
          where: { student_id: studentCtx },
          orderBy: { submitted_at: 'desc' },
          take: 1,
        } : false,
        _count: {
          select: {
            submissions: true,
          }
        }
      },
      orderBy: { created_at: 'desc' },
    });

    // To get graded_count, we need a separate count since Prisma _count doesn't support filters easily in older versions
    // But we can fetch it efficiently.
    const assignmentIds = assignments.map((a: any) => a.id);
    const gradedCounts = await prisma.assignmentSubmission.groupBy({
      by: ['assignment_id'],
      where: { assignment_id: { in: assignmentIds }, graded_at: { not: null } },
      _count: { id: true },
    });
    const gradedCountMap = Object.fromEntries(gradedCounts.map((gc: any) => [gc.assignment_id, gc._count.id]));

    return assignments.map((a: any) => {
      const mySub = a.submissions?.[0];
      return {
        ...a,
        coach_name: a.coach?.name,
        batch_name: a.batch?.name,
        total_submissions: a._count.submissions,
        graded_count: gradedCountMap[a.id] || 0,
        submitted_at: mySub?.submitted_at,
        graded_at: mySub?.graded_at,
        grade: mySub?.score,
        feedback: mySub?.feedback,
        submission: mySub?.submission,
      };
    });
  }

  static async createAssignment(data: any, currentUser: any) {
    const { title, description, type, batchId, studentId, dueDate, content, passingScore, maxAttempts } = data;
    
    const assignment = await prisma.assignment.create({
      data: {
        coach_id: currentUser.id,
        batch_id: batchId || null,
        student_id: studentId || null,
        title,
        description,
        type: type || 'puzzle',
        due_date: dueDate ? new Date(dueDate) : undefined,
        content: content || {},
        passing_score: passingScore || 70,
        max_attempts: maxAttempts || 3,
      },
    });

    // Notifications
    try {
      if (studentId) {
        await prisma.notification.create({
          data: {
            user_id: studentId,
            type: 'assignment',
            title: `New Assignment: ${title}`,
            body: description ? description.slice(0, 100) : 'Check your new assignment.',
          }
        });
      } else if (batchId) {
        const batchStudents = await prisma.batchEnrollment.findMany({
          where: { batch_id: batchId, is_active: true },
          select: { student_id: true },
        });

        if (batchStudents.length > 0) {
          await prisma.notification.createMany({
            data: batchStudents.map((s: any) => ({
              user_id: s.student_id,
              type: 'assignment',
              title: `New Assignment: ${title}`,
              body: description ? description.slice(0, 100) : 'Check your new assignment.',
            }))
          });
        }
      }
    } catch (err: any) {
      console.error('[Assignments Notif Error]', err.message);
    }

    return assignment.id;
  }

  static async submitAssignment(assignmentId: string, studentId: string, submission: any) {
    const attemptCount = await prisma.assignmentSubmission.count({
      where: { assignment_id: assignmentId, student_id: studentId },
    });

    const sub = await prisma.assignmentSubmission.create({
      data: {
        assignment_id: assignmentId,
        student_id: studentId,
        attempt_number: attemptCount + 1,
        submission: submission || {},
      },
    });
    return sub.id;
  }

  static async getSubmissions(assignmentId: string) {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignment_id: assignmentId },
      include: {
        student: { select: { name: true, avatar: true } },
      },
      orderBy: { submitted_at: 'desc' },
    });

    return submissions.map((s: any) => ({
      ...s,
      grade: s.score,
      student_name: s.student.name,
      student_avatar: s.student.avatar,
    }));
  }

  static async getAssignment(id: string, currentUser: any) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        coach: { select: { name: true } },
        batch: { select: { name: true } },
        student: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
    });

    if (!assignment) return null;

    // Get graded count
    const gradedCount = await prisma.assignmentSubmission.count({
      where: { assignment_id: id, graded_at: { not: null } },
    });

    let mySubmission = null;
    if (currentUser.role === 'student') {
      mySubmission = await prisma.assignmentSubmission.findFirst({
        where: { assignment_id: id, student_id: currentUser.id },
        orderBy: { submitted_at: 'desc' },
      });
    }

    return {
      assignment: {
        ...assignment,
        coach_name: assignment.coach?.name,
        batch_name: assignment.batch?.name,
        student_name: assignment.student?.name,
        total_submissions: assignment._count.submissions,
        graded_count: gradedCount,
      },
      mySubmission: mySubmission ? { ...mySubmission, grade: mySubmission.score } : null,
    };
  }

  static async updateAssignment(id: string, data: any, currentUser: any) {
    const { title, description, type, dueDate, content, passingScore, maxAttempts } = data;
    await prisma.assignment.update({
      where: { id, coach_id: currentUser.id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        type: type !== undefined ? type : undefined,
        due_date: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        content: content !== undefined ? content : undefined,
        passing_score: passingScore !== undefined ? passingScore : undefined,
        max_attempts: maxAttempts !== undefined ? maxAttempts : undefined,
      },
    });
  }

  static async deleteAssignment(id: string, currentUser: any) {
    await prisma.assignment.delete({
      where: { id, coach_id: currentUser.id },
    });
  }

  static async gradeSubmission(submissionId: string, coachId: string, score: number, feedback: string) {
    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        graded_by: coachId,
        graded_at: new Date(),
      },
    });
  }
}

export default AssignmentService;
