import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AnnouncementService from '@/src/services/announcementService';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['coach', 'academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    await AnnouncementService.updateAnnouncement(params.id, body, auth.user.academyId);
    return NextResponse.json({ message: 'Announcement updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await AnnouncementService.deleteAnnouncement(params.id, auth.user.academyId);
    return NextResponse.json({ message: 'Announcement deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
