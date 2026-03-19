export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import MessagingService from '@/src/services/messagingService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const conversations = await MessagingService.listConversations(auth.user.id);
    return NextResponse.json({ conversations });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
