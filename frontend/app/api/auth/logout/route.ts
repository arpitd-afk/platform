export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { cache } from '@/src/lib/redis';

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (user) {
    await cache.del(`session:${user.id}`);
  }
  return NextResponse.json({ message: 'Logged out successfully' });
}
