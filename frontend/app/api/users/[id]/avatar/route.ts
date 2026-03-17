import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import UserService from '@/src/services/userService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    if (auth.user.id !== params.id && !['super_admin', 'academy_admin'].includes(auth.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { avatarBase64 } = await req.json();
    await UserService.updateAvatar(params.id, avatarBase64);
    return NextResponse.json({ message: 'Avatar updated', avatar: avatarBase64 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to update avatar' }, { status: 500 });
  }
}
