import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import ContentService from '@/src/services/contentService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['coach', 'academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { lessonId, orderIndex } = await req.json();
    await ContentService.addLessonToCourse(params.id, lessonId, orderIndex);
    return NextResponse.json({ message: 'Lesson added to course' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
