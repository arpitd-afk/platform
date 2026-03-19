export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import ContentService from '@/src/services/contentService';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['coach', 'academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { publish } = await req.json();
    await ContentService.updateLesson(params.id, { isPublished: publish }, auth.user);
    return NextResponse.json({ message: publish ? 'Lesson published' : 'Lesson unpublished' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
