export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { ClassroomService } from '@/src/services/classroomService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  if (user.role !== 'coach' && user.role !== 'academy_admin' && user.role !== 'super_admin') {
    return authResponse('Forbidden', 403);
  }

  // If super admin or academy admin, they might want a specific coach summary (optional extension)
  // For now, default to the logged-in user if they are a coach
  const coachId = user.role === 'coach' ? user.id : req.nextUrl.searchParams.get('coachId');
  
  if (!coachId) {
    return NextResponse.json({ message: 'Coach ID required' }, { status: 400 });
  }

  try {
    const summary = await ClassroomService.getCoachSummary(coachId);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
