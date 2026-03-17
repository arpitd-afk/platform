import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import MessagingService from '@/src/services/messagingService';

export async function GET(req: NextRequest, { params }: { params: { batchId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const before = searchParams.get('before') || undefined;
    const limit = parseInt(searchParams.get('limit') || '60');
    
    const messages = await MessagingService.listBatchMessages(params.batchId, { limit, before }, auth.user);
    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { batchId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { content } = await req.json();
    const id = await MessagingService.sendBatchMessage(params.batchId, content, auth.user);
    return NextResponse.json({ message: 'Sent', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
