export const dynamic = "force-dynamic";
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
    const question = await PuzzleService.getMcqById(params.id, user.id, user.role);
    if (!question) return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    return NextResponse.json({ question });
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
    await PuzzleService.updateMcq(params.id, user.academyId, body);
    return NextResponse.json({ message: 'MCQ updated' });
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
    await PuzzleService.deleteMcq(params.id, user.academyId);
    return NextResponse.json({ message: 'MCQ deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
