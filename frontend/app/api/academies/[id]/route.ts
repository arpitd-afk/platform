import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import AcademyService from '@/src/services/academyService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (auth.user.role !== 'super_admin' && auth.user.academyId !== params.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const academy = await AcademyService.getById(params.id);
    if (!academy) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ academy });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (auth.user.role !== 'super_admin' && auth.user.academyId !== params.id) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    await AcademyService.updateAcademy(params.id, body);
    return NextResponse.json({ message: 'Academy updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
