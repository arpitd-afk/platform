export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import ContentService from '@/src/services/contentService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      academyId: searchParams.get('academyId') || auth.user.academyId,
      level: searchParams.get('level') || undefined,
      isPublished: true,
    };

    const lessons = await ContentService.listLessons(params);
    return NextResponse.json({ lessons });
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
    const id = await ContentService.createLesson(body, auth.user);
    return NextResponse.json({ message: 'Lesson created', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
