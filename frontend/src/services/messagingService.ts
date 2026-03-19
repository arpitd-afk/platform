import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface BatchMessageWithSender extends Prisma.BatchMessageGetPayload<{
  include: { sender: { select: { name: true, role: true, avatar: true } } }
}> {}

export interface DirectMessageWithSender extends Prisma.MessageGetPayload<{
  include: { sender: { select: { name: true, role: true } } }
}> {}

export class MessagingService {
  static async listBatchMessages(batchId: string, params: { limit?: number, before?: string }, currentUser: { id: string, role: string }) {
    const { limit = 60, before } = params;
    
    // Auth check
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        enrollments: { where: { student_id: currentUser.id, is_active: true } },
      },
    });

    const isAuthorized = batch && (
      batch.coach_id === currentUser.id ||
      batch.enrollments.length > 0 ||
      ['academy_admin', 'super_admin'].includes(currentUser.role)
    );

    if (!isAuthorized) throw new Error('Forbidden');

    const where: Prisma.BatchMessageWhereInput = { batch_id: batchId };
    if (before) {
      where.created_at = { lt: new Date(before) };
    }

    const messages = await prisma.batchMessage.findMany({
      where,
      include: {
        sender: {
          select: {
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
      take: limit,
    });

    return messages.map((m: BatchMessageWithSender) => ({
      ...m,
      sender_name: m.sender?.name || 'Unknown',
      sender_role: m.sender?.role || 'user',
      sender_avatar: m.sender?.avatar || null,
    }));
  }

  static async sendBatchMessage(batchId: string, content: string, currentUser: { id: string, role: string }) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        enrollments: { where: { student_id: currentUser.id, is_active: true } },
      },
    });

    const isAuthorized = batch && (
      batch.coach_id === currentUser.id ||
      batch.enrollments.length > 0 ||
      ['academy_admin', 'super_admin'].includes(currentUser.role)
    );

    if (!isAuthorized) throw new Error('Forbidden');

    const message = await prisma.batchMessage.create({
      data: {
        batch_id: batchId,
        sender_id: currentUser.id,
        content: content.trim(),
      },
    });
    return message.id;
  }

  static async deleteBatchMessage(msgId: string, userId: string) {
    const message = await prisma.batchMessage.delete({
      where: { id: msgId, sender_id: userId },
    });
    return message;
  }

  static async listConversations(userId: string) {
    const conversations = await prisma.$queryRaw<any[]>`
      SELECT
        conv.other_user,
        u.name as other_name, u.role as other_role, u.avatar as other_avatar,
        conv.last_message, conv.last_at, conv.last_sender_id,
        (SELECT COUNT(*)::int FROM messages unread 
         WHERE unread.sender_id = conv.other_user 
           AND unread.receiver_id = ${userId}::uuid 
           AND unread.is_read = false) as unread_count
       FROM (
         SELECT
           CASE WHEN sender_id = ${userId}::uuid THEN receiver_id ELSE sender_id END as other_user,
           content as last_message, created_at as last_at, sender_id as last_sender_id,
           ROW_NUMBER() OVER (
             PARTITION BY CASE WHEN sender_id = ${userId}::uuid THEN receiver_id ELSE sender_id END
             ORDER BY created_at DESC
           ) as rn
         FROM messages
         WHERE sender_id = ${userId}::uuid OR receiver_id = ${userId}::uuid
       ) conv
       JOIN users u ON u.id = conv.other_user
       WHERE conv.rn = 1
       ORDER BY conv.last_at DESC
    `;
    
    return conversations;
  }

  static async listDirectMessages(userId: string, otherUserId: string, limit: number = 50) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: userId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: userId },
        ],
      },
      include: {
        sender: { select: { name: true, role: true } },
      },
      orderBy: { created_at: 'asc' },
      take: limit,
    });

    // Mark as read
    await prisma.message.updateMany({
      where: { sender_id: otherUserId, receiver_id: userId, is_read: false },
      data: { is_read: true },
    });

    return messages.map((m: DirectMessageWithSender) => ({
      ...m,
      sender_name: m.sender?.name,
      sender_role: m.sender?.role,
    }));
  }

  static async sendDirectMessage(senderId: string, receiverId: string, content: string) {
    const message = await prisma.message.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false,
      },
    });
    return message.id;
  }

  static async listContacts(currentUser: { role: string, academyId: string, id: string }) {
    const role = currentUser.role;
    let roleFilter: string[] = [];
    if (role === 'student') roleFilter = ['coach', 'academy_admin'];
    else if (role === 'coach') roleFilter = ['student', 'academy_admin'];
    else if (role === 'parent') roleFilter = ['coach', 'academy_admin'];
    else if (role === 'academy_admin') roleFilter = ['coach', 'student', 'parent'];
    else roleFilter = ['academy_admin', 'coach', 'student', 'parent', 'super_admin'];

    const users = await prisma.user.findMany({
      where: {
        role: { in: roleFilter },
        academy_id: currentUser.academyId,
        is_active: true,
        id: { not: currentUser.id },
      },
      select: { id: true, name: true, email: true, role: true, avatar: true },
      orderBy: { name: 'asc' },
      take: 100,
    });

    return users;
  }

  static async getUnreadCount(userId: string) {
    const count = await prisma.message.count({
      where: { receiver_id: userId, is_read: false },
    });
    return count;
  }

  static async markAsRead(userId: string, otherUserId: string) {
    await prisma.message.updateMany({
      where: { sender_id: otherUserId, receiver_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  static async deleteMessage(msgId: string, userId: string) {
    const message = await prisma.message.delete({
      where: { id: msgId, sender_id: userId },
    });
    return message;
  }
}

export default MessagingService;
