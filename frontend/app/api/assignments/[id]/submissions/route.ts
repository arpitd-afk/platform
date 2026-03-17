import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AssignmentService from '@/src/services/assignmentService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    if (!['coach', 'academy_admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const submissions = await AssignmentService.getSubmissions(params.id);
    return NextResponse.json({ submissions });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
