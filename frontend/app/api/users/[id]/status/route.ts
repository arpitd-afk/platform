import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { UserService } from '@/src/services/userService';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  if (!['academy_admin', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const { is_active } = await req.json();
    await UserService.update(params.id, { is_active }, user);
    return NextResponse.json({ message: 'Status updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
