export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AssignmentService from '@/src/services/assignmentService';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    if (!['coach', 'academy_admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { grade, feedback } = await req.json();

    if (grade !== undefined && (isNaN(grade) || grade < 0 || grade > 100)) {
      return NextResponse.json({ message: 'Grade must be 0–100' }, { status: 400 });
    }

    await AssignmentService.gradeSubmission(
      params.submissionId,
      auth.user.id,
      grade,
      feedback
    );

    return NextResponse.json({ message: 'Submission graded successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
