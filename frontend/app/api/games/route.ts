export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { GameService } from '@/src/services/gameService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const result = await GameService.listGames({
      userId: user.id,
      status,
      page,
      limit
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to list games' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    const body = await req.json();
    const { opponentId, timeControl, mode, tournamentId, classroomId, color = 'random' } = body;

    let whiteId, blackId;
    if (color === 'white') {
      whiteId = user.id;
      blackId = opponentId;
    } else if (color === 'black') {
      whiteId = opponentId;
      blackId = user.id;
    } else {
      if (Math.random() > 0.5) {
        whiteId = user.id;
        blackId = opponentId;
      } else {
        whiteId = opponentId;
        blackId = user.id;
      }
    }

    const game = await GameService.createGame({
      whiteId,
      blackId,
      timeControl,
      mode,
      tournamentId,
      classroomId
    });

    return NextResponse.json({ message: 'Game created', gameId: game.id, gameState: game }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create game' }, { status: 500 });
  }
}
