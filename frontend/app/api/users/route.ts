export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/src/lib/auth';
import UserService from '@/src/services/userService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      academyId: searchParams.get('academyId') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const users = await UserService.listUsers(params, auth.user);
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const user = await UserService.createUser(body, auth.user);
    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create user' }, { status: 500 });
  }
}
