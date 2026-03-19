export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/src/services/authService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const result = await AuthService.login(email, password, ip as string);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Login failed' }, { status: 401 });
  }
}
