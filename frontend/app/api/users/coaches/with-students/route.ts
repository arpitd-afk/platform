export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { UserService } from '@/src/services/userService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  if (!['academy_admin', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  const academyId = user.role === 'super_admin' ? req.nextUrl.searchParams.get('academyId') : user.academyId;
  
  if (!academyId) {
    return NextResponse.json({ message: 'Academy ID required' }, { status: 400 });
  }

  try {
    const coaches = await UserService.getCoachesWithStudents(academyId);
    return NextResponse.json({ coaches });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
