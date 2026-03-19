export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AssignmentService from '@/src/services/assignmentService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      studentId: searchParams.get('studentId') || undefined,
      batchId: searchParams.get('batchId') || undefined,
    };

    const assignments = await AssignmentService.listAssignments(params, auth.user);
    return NextResponse.json({ assignments });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const id = await AssignmentService.createAssignment(body, auth.user);
    return NextResponse.json({ message: 'Assignment created', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
