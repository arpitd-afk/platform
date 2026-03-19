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

  const { searchParams } = new URL(req.url);
  const round = searchParams.get('round') ? parseInt(searchParams.get('round')!) : undefined;

  try {
    const matches = await TournamentService.getMatches(params.id, round);
    return NextResponse.json({ matches });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
