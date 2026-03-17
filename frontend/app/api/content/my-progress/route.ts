import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import ContentService from '@/src/services/contentService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const progress = await ContentService.getProgress(auth.user.id);
    return NextResponse.json({ progress });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
