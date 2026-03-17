import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/src/lib/auth';
import AcademyService from '@/src/services/academyService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (auth.user.role !== 'super_admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      plan: searchParams.get('plan') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const result = await AcademyService.listAcademies(params);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (auth.user.role !== 'super_admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const result = await AcademyService.createAcademy(body, auth.user);
    return NextResponse.json({ message: 'Academy created', ...result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
