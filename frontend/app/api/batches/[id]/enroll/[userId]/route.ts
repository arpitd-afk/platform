import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import BatchService from '@/src/services/batchService';

export async function DELETE(req: NextRequest, { params }: { params: { id: string, userId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['academy_admin', 'super_admin', 'coach'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await BatchService.removeStudent(params.id, params.userId);
    return NextResponse.json({ message: 'Student removed' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
