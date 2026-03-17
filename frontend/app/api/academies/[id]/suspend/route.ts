import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { AcademyService } from '@/src/services/academyService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user || user.role !== 'super_admin') return authResponse('Forbidden', 403);

  try {
    await AcademyService.setStatus(params.id, false, user);
    return NextResponse.json({ message: 'Academy suspended' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
