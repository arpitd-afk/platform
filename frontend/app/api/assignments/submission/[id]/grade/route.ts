export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AssignmentService from '@/src/services/assignmentService';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    if (!['coach', 'academy_admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { score, feedback } = await req.json();
    await AssignmentService.gradeSubmission(params.id, auth.user.id, score, feedback);
    return NextResponse.json({ message: 'Graded successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
