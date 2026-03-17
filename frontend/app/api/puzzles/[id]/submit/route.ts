import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/src/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { moves, timeTakenMs } = await req.json();
    const puzzle = await query('SELECT moves FROM puzzles WHERE id=$1', [params.id]);
    if (!puzzle.rows.length) return NextResponse.json({ message: 'Puzzle not found' }, { status: 404 });
    
    const expected = puzzle.rows[0].moves.split(' ');
    const isCorrect = JSON.stringify(moves) === JSON.stringify(expected);
    
    await query(
      'INSERT INTO puzzle_attempts (id, puzzle_id, user_id, is_correct, time_taken_ms, attempted_at) VALUES ($1,$2,$3,$4,$5,NOW())',
      [uuidv4(), params.id, auth.user.id, isCorrect, timeTakenMs || null]
    );
    
    return NextResponse.json({ isCorrect, correct: expected });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
