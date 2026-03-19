export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { TournamentService } from '@/src/services/tournamentService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const { id } = params;

  try {
    const result = await TournamentService.getTournamentById(id);
    if (!result) return NextResponse.json({ message: 'Tournament not found' }, { status: 404 });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get tournament' }, { status: 500 });
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  // Only organizer or admin can update
  const t = await TournamentService.getTournamentById(params.id);
  if (!t) return NextResponse.json({ message: 'Tournament not found' }, { status: 404 });
  
  if (t.tournament.organizer_id !== user.id && !['academy_admin', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const body = await req.json();
    await TournamentService.updateTournament(params.id, body);
    return NextResponse.json({ message: 'Tournament updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to update tournament' }, { status: 500 });
  }
}
