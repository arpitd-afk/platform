import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AnalyticsService from '@/src/services/analyticsService';

export async function GET(req: NextRequest, { params }: { params: { academyId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (auth.user.role !== 'super_admin' && auth.user.academyId !== params.academyId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const analytics = await AnalyticsService.getAcademyAnalytics(params.academyId);
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
