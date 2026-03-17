import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AnnouncementService from '@/src/services/announcementService';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { pinned } = await req.json();
    await AnnouncementService.setPinned(params.id, pinned, auth.user.academyId);
    return NextResponse.json({ message: pinned ? 'Pinned' : 'Unpinned' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
