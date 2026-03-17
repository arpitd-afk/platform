import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import UserService from '@/src/services/userService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    if (auth.user.role !== 'parent') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const children = await UserService.getMyChildren(auth.user.id);
    return NextResponse.json({ children });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get children' }, { status: 500 });
  }
}
