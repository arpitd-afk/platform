export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import MessagingService from '@/src/services/messagingService';

export async function DELETE(req: NextRequest, { params }: { params: { batchId: string, msgId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await MessagingService.deleteBatchMessage(params.msgId, auth.user.id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
