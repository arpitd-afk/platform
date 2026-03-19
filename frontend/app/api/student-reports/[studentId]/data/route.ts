export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import StudentReportService from '@/src/services/studentReportService';

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const periodDays = parseInt(searchParams.get('periodDays') || '90');
    
    const data = await StudentReportService.getReportData(params.studentId, auth.user.academyId, periodDays, auth.user);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'Forbidden') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    if (error.message === 'Student not found') return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
