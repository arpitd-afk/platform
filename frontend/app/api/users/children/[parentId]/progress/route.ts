export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import UserService from '@/src/services/userService';

export async function GET(req: NextRequest, { params }: { params: { parentId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    if (auth.user.id !== params.parentId && !['super_admin', 'academy_admin'].includes(auth.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const progress = await UserService.getChildrenProgress(params.parentId);
    return NextResponse.json({ progress });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get progress' }, { status: 500 });
  }
}
