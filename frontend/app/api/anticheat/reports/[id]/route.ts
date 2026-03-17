import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AntiCheatService from '@/src/services/antiCheatService';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['super_admin', 'academy_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    await AntiCheatService.reviewReport(params.id, body, auth.user);
    return NextResponse.json({ message: `Report updated` });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
