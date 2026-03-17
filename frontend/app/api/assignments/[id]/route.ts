import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AssignmentService from '@/src/services/assignmentService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const data = await AssignmentService.getAssignment(params.id, auth.user);
    if (!data) return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    await AssignmentService.updateAssignment(params.id, body, auth.user);
    return NextResponse.json({ message: 'Assignment updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await AssignmentService.deleteAssignment(params.id, auth.user);
    return NextResponse.json({ message: 'Assignment deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
