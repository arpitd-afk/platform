export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { GameService } from '@/src/services/gameService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const { id } = params;

  try {
    const game = await GameService.getGameById(id);
    if (!game) return NextResponse.json({ message: 'Game not found' }, { status: 404 });

    return NextResponse.json({ game });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get game' }, { status: 500 });
  }
}
