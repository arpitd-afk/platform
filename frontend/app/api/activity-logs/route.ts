import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import ActivityLogService from '@/src/services/activityLogService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      userId: searchParams.get('userId') || undefined,
      academyId: searchParams.get('academyId') || auth.user.academyId,
      action: searchParams.get('action') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const logs = await ActivityLogService.listLogs(params);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const id = await ActivityLogService.logActivity({
      ...body,
      academyId: auth.user.academyId,
      userId: auth.user.id
    });
    return NextResponse.json({ message: 'Logged', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
