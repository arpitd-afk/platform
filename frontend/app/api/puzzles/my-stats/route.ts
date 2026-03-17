import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { PuzzleService } from '@/src/services/puzzleService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    const stats = await PuzzleService.getStats(user.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
