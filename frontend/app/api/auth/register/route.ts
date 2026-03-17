import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/src/services/authService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const result = await AuthService.register(body, ip as string);
    
    return NextResponse.json({ 
      message: 'Account created successfully', 
      ...result 
    }, { status: 201 });
  } catch (error: any) {
    const status = error.message === 'Email already registered' || error.message === 'Subdomain already taken' ? 409 : 400;
    return NextResponse.json({ message: error.message || 'Registration failed' }, { status });
  }
}
