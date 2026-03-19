export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { TournamentService } from '@/src/services/tournamentService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  // Only organizer or admin can generate next round
  const t = await TournamentService.getTournamentById(params.id);
  if (!t) return NextResponse.json({ message: 'Tournament not found' }, { status: 404 });
  
  if (t.tournament.organizer_id !== user.id && !['academy_admin', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const result = await TournamentService.generateNextRound(params.id, user);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
