import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { TournamentService } from '@/src/services/tournamentService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    await TournamentService.registerPlayer(params.id, user.id);
    return NextResponse.json({ message: 'Registered successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    await TournamentService.unregisterPlayer(params.id, user.id);
    return NextResponse.json({ message: 'Unregistered successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
