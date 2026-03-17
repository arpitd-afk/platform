import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import PuzzleService from '@/src/services/puzzleService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const puzzle = await PuzzleService.getDailyPuzzle();
    return NextResponse.json({ puzzle });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
