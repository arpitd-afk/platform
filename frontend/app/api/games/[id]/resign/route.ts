import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { GameService } from '@/src/services/gameService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const game = await GameService.getGameById(params.id);
  if (!game) return NextResponse.json({ message: 'Game not found' }, { status: 404 });

  // Only players in the game can resign
  if (game.white_player_id !== user.id && game.black_player_id !== user.id) {
    return authResponse('Forbidden', 403);
  }

  try {
    const result = await GameService.resign(params.id, user.id);
    return NextResponse.json({ message: 'Resigned successfully', result });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
