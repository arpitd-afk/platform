import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { PuzzleService } from '@/src/services/puzzleService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    const puzzle = await PuzzleService.getCustomPuzzleById(params.id, user.id, user.role);
    if (!puzzle) return NextResponse.json({ message: 'Puzzle not found' }, { status: 404 });
    return NextResponse.json({ puzzle });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  try {
    if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) {
      return authResponse('Forbidden');
    }
    const body = await req.json();
    await PuzzleService.updateCustomPuzzle(params.id, user.academyId, body);
    return NextResponse.json({ message: 'Puzzle updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) {
      return authResponse('Forbidden');
    }
    await PuzzleService.deleteCustomPuzzle(params.id, user.academyId);
    return NextResponse.json({ message: 'Puzzle deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
