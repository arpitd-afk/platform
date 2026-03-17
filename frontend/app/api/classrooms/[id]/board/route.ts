import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { ClassroomService } from '@/src/services/classroomService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  if (!['coach', 'academy_admin', 'super_admin'].includes(user.role)) return authResponse('Forbidden', 403);

  try {
    const { pgn, fen } = await req.json();
    await ClassroomService.saveBoard(params.id, pgn, fen);
    return NextResponse.json({ message: 'Board saved' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
