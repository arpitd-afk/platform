export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { TournamentService } from '@/src/services/tournamentService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const { searchParams } = new URL(req.url);
  const academyId = searchParams.get('academyId') || undefined;
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const tournaments = await TournamentService.getTournaments({
      academyId,
      status,
      userId: user.id,
      page,
      limit
    });
    return NextResponse.json({ tournaments });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get tournaments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  // Check authorization
  if (!['academy_admin', 'coach', 'super_admin'].includes(user.role)) {
    return authResponse('Forbidden', 403);
  }

  try {
    const body = await req.json();
    const id = await TournamentService.createTournament({
      ...body,
      academyId: user.academyId,
      organizerId: user.id
    });
    return NextResponse.json({ message: 'Tournament created', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create tournament' }, { status: 500 });
  }
}
