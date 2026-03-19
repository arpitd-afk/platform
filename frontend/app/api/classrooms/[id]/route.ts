export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { ClassroomService } from '@/src/services/classroomService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    const classroom = await ClassroomService.getById(params.id);
    if (!classroom) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ classroom });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) return authResponse('Forbidden', 403);

  try {
    const body = await req.json();
    await ClassroomService.update(params.id, body);
    return NextResponse.json({ message: 'Updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) return authResponse('Forbidden', 403);

  try {
    await ClassroomService.cancel(params.id);
    return NextResponse.json({ message: 'Cancelled' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
