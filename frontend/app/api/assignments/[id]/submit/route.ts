import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AssignmentService from '@/src/services/assignmentService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { submission } = await req.json();
    const submissionId = await AssignmentService.submitAssignment(params.id, auth.user.id, submission);
    return NextResponse.json({ message: 'Submitted', submissionId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
