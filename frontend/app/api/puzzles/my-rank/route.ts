import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { PuzzleService } from '@/src/services/puzzleService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    const rank = await PuzzleService.getMyRank(user.id, user.academyId);
    return NextResponse.json(rank);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
