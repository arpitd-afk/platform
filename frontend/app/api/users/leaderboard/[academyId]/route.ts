import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import UserService from '@/src/services/userService';

export async function GET(req: NextRequest, { params }: { params: { academyId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const leaderboard = await UserService.getLeaderboard(params.academyId);
    return NextResponse.json({ leaderboard });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get leaderboard' }, { status: 500 });
  }
}
