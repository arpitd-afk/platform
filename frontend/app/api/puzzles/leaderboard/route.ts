import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { PuzzleService } from '@/src/services/puzzleService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const academyId = req.nextUrl.searchParams.get('academyId') || user.academyId;
  
  if (!academyId) {
    return NextResponse.json({ message: 'Academy ID required' }, { status: 400 });
  }

  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const leaderboard = await PuzzleService.getLeaderboard(academyId, limit);
    return NextResponse.json({ leaderboard });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
