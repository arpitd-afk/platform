import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { ClassroomService } from '@/src/services/classroomService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  // Only coach or admin can update attendance
  if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const { present, absent } = await req.json();
    await ClassroomService.bulkAttendance(params.id, present || [], absent || []);
    return NextResponse.json({ message: 'Attendance updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
