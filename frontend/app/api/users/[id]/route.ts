export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import UserService from '@/src/services/userService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const user = await UserService.getById(params.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const user = await UserService.update(params.id, body, auth.user);
    return NextResponse.json({ message: 'Updated', user });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Update failed' }, { status: 500 });
  }
}
