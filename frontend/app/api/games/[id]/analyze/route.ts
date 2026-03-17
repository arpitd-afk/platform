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

  // Any player in the game or coach/admin can request analysis
  if (game.white_player_id !== user.id && game.black_player_id !== user.id && !['coach', 'academy_admin', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const result = await GameService.analyze(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
