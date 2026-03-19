export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import StudentReportService from '@/src/services/studentReportService';
import { generateStudentReportPDF } from '@/src/utils/pdfGenerator';

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { studentId } = params;
    const { searchParams } = new URL(req.url);
    const periodDays = parseInt(searchParams.get('periodDays') || '90');

    const data = await StudentReportService.getReportData(studentId, auth.user.academyId, periodDays, auth.user);
    const pdfBuffer = await generateStudentReportPDF(data);

    const safeName = (data.student.name || 'student').replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report_${safeName}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
