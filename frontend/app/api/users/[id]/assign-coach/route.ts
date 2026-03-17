import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { UserService } from '@/src/services/userService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  if (!['academy_admin', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const { coachId } = await req.json();
    await UserService.assignCoach(params.id, coachId || null, user.academyId || '');
    return NextResponse.json({ message: 'Coach assigned' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
