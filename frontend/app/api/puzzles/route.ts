export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { PuzzleService } from '@/src/services/puzzleService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'stats' | 'history'

  try {
    if (type === 'stats') {
      const stats = await PuzzleService.getStats(user.id);
      return NextResponse.json({ stats });
    } else if (type === 'history') {
      const limit = parseInt(searchParams.get('limit') || '20');
      const history = await PuzzleService.getHistory(user.id, limit);
      return NextResponse.json({ history });
    }
    
    return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
