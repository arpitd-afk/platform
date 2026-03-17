import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AnalyticsService from '@/src/services/analyticsService';

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { studentId } = params;
  const canAccess =
    auth.user.id === studentId ||
    ['super_admin', 'academy_admin', 'coach'].includes(auth.user.role);

  if (!canAccess) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';
    const analytics = await AnalyticsService.getStudentAnalytics(studentId, period);
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
