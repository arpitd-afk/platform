import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import BatchService from '@/src/services/batchService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['academy_admin', 'super_admin', 'coach'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId } = await req.json();
    await BatchService.enrollStudent(params.id, userId);
    return NextResponse.json({ message: 'Student enrolled' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['academy_admin', 'super_admin', 'coach'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ message: 'userId required' }, { status: 400 });

    await BatchService.removeStudent(params.id, userId);
    return NextResponse.json({ message: 'Student removed' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
