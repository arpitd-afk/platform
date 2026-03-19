export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { AuthService } from '@/src/services/authService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const fullUser = await AuthService.getUserById(user.id);
  if (!fullUser) return authResponse('User not found', 404);

  return NextResponse.json({ user: fullUser });
}
