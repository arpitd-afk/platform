export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { PuzzleService } from '@/src/services/puzzleService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get('difficulty') || undefined;
  const theme = searchParams.get('theme') || undefined;

  try {
    const puzzles = await PuzzleService.getCustomPuzzles({
      academyId: user.academyId!,
      userId: user.id,
      role: user.role,
      difficulty,
      theme
    });
    return NextResponse.json({ puzzles });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) return authResponse('Forbidden', 403);

  try {
    const body = await req.json();
    const id = await PuzzleService.createCustomPuzzle({
      ...body,
      academyId: user.academyId,
      createdBy: user.id
    });
    return NextResponse.json({ message: 'Puzzle created', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create puzzle' }, { status: 500 });
  }
}
