export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { AcademyService } from '@/src/services/academyService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  // Only academy admin or super admin can see stats
  if (user.role !== 'super_admin' && user.academyId !== params.id) {
    return authResponse('Forbidden', 403);
  }

  try {
    const stats = await AcademyService.getStats(params.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
