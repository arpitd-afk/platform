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
    const attendance = await ClassroomService.getAttendance(params.id);
    return NextResponse.json({ attendance });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) return authResponse('Forbidden', 403);

  try {
    const { studentId, present, bulk, presentIds, absentIds } = await req.json();
    
    if (bulk) {
      await ClassroomService.bulkAttendance(params.id, presentIds || [], absentIds || []);
    } else {
      await ClassroomService.updateAttendance(params.id, studentId, present);
    }
    
    return NextResponse.json({ message: 'Attendance updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
