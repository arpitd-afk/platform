import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { TournamentService } from '@/src/services/tournamentService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    const { searchParams } = new URL(req.url);
    const round = searchParams.get('round');
    
    // Pass undefined if round is not a number
    const roundNum = round ? parseInt(round) : undefined;
    
    const allMatches = await TournamentService.getMatches(params.id, roundNum);
    
    const byRound = allMatches.reduce((acc: any, m: any) => {
      if (!acc[m.round]) acc[m.round] = [];
      acc[m.round].push(m);
      return acc;
    }, {});

    return NextResponse.json({ 
      pairings: allMatches, 
      byRound 
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
