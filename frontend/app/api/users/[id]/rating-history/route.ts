import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { UserService } from '@/src/services/userService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30');
    const history = await UserService.getRatingHistory(params.id, limit);
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
