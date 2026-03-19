export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { query } from '@/src/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    const body = await req.json();
    const { fen, pgn, timeControl, result, whiteName, blackName, mode = 'practice' } = body;

    const gameId = uuidv4();
    
    // We attribute the game to the current user as white by default in practice
    await query(
      `INSERT INTO games (
        id, white_player_id, black_player_id, fen, pgn, status, result, 
        time_control, mode, created_at, updated_at
      ) VALUES ($1, $2, NULL, $3, $4, 'completed', $5, $6, $7, NOW(), NOW())`,
      [
        gameId, 
        user.id, 
        fen, 
        pgn, 
        JSON.stringify(result), 
        timeControl || '10+0', 
        mode
      ]
    );

    return NextResponse.json({ message: 'Practice game saved', gameId }, { status: 201 });
  } catch (error: any) {
    console.error('[Save Practice Error]', error.message);
    return NextResponse.json({ message: error.message || 'Failed to save practice game' }, { status: 500 });
  }
}
