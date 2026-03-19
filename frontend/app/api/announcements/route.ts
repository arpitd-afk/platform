export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AnnouncementService from '@/src/services/announcementService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      academyId: auth.user.academyId,
      userId: auth.user.id,
      role: auth.user.role,
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const announcements = await AnnouncementService.listAnnouncements(params);
    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['coach', 'academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const id = await AnnouncementService.createAnnouncement(body, auth.user);
    return NextResponse.json({ message: 'Announcement posted', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
