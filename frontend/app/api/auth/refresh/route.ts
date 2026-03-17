import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { AuthService, generateToken } from '@/src/services/authService';

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const fullUser = await AuthService.getUserById(user.id);
  if (!fullUser) return authResponse('User not found', 404);

  const token = generateToken(fullUser);
  return NextResponse.json({ token });
}
