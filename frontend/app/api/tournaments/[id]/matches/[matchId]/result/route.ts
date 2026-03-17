import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { TournamentService } from '@/src/services/tournamentService';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string, matchId: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  // Only organizer or admin can set results
  const t = await TournamentService.getTournamentById(params.id);
  if (!t) return NextResponse.json({ message: 'Tournament not found' }, { status: 404 });
  
  if (t.tournament.organizer_id !== user.id && !['academy_admin', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const { result } = await req.json();
    await TournamentService.updateMatchResult(params.id, params.matchId, result, user);
    return NextResponse.json({ message: 'Result updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
