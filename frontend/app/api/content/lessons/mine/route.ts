import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import ContentService from '@/src/services/contentService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['coach', 'academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      authorId: auth.user.id,
      academyId: auth.user.academyId,
      level: searchParams.get('level') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const lessons = await ContentService.listLessons(params);
    return NextResponse.json({ lessons });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
