import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { UserService } from '@/src/services/userService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  // Only admin or coach can link parents
  if (!['academy_admin', 'super_admin', 'coach'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const { parentEmail } = await req.json();
    if (!parentEmail) return NextResponse.json({ message: 'Parent email required' }, { status: 400 });
    
    const result = await UserService.linkParent(params.id, parentEmail);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
