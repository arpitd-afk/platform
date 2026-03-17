import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import NotificationService from '@/src/services/notificationService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const count = await NotificationService.getUnreadCount(auth.user.id);
    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
