import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import MessagingService from '@/src/services/messagingService';

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { receiverId, content } = await req.json();
    const id = await MessagingService.sendDirectMessage(auth.user.id, receiverId, content);
    
    const io = (global as any).io;
    if (io) {
      const msgPayload = {
        id, sender_id: auth.user.id, receiver_id: receiverId,
        sender_name: auth.user.name, sender_role: auth.user.role,
        content: content.trim(), created_at: new Date(), is_read: false
      };
      io.to(`user:${receiverId}`).emit('message:new', msgPayload);
      io.to(`user:${auth.user.id}`).emit('message:new', msgPayload);
    }

    return NextResponse.json({ message: 'Sent', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
