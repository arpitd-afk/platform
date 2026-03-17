import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { PuzzleService } from '@/src/services/puzzleService';

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get('difficulty') || undefined;

  try {
    const questions = await PuzzleService.getMcqs({
      academyId: user.academyId!,
      userId: user.id,
      role: user.role,
      difficulty
    });
    return NextResponse.json({ questions });
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
    const id = await PuzzleService.createMcq({
      ...body,
      academyId: user.academyId,
      createdBy: user.id
    });
    return NextResponse.json({ message: 'MCQ created', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
