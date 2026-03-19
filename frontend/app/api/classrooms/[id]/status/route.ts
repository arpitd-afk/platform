export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { ClassroomService } from '@/src/services/classroomService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) return authResponse('Forbidden', 403);

  try {
    const { action } = await req.json(); // 'start' | 'end'
    
    if (action === 'start') {
      await ClassroomService.start(params.id);
      return NextResponse.json({ message: 'Classroom started' });
    } else if (action === 'end') {
      await ClassroomService.end(params.id);
      return NextResponse.json({ message: 'Classroom ended' });
    }
    
    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
