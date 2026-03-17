import { NextRequest, NextResponse } from 'next/server';
import AcademyService from '@/src/services/academyService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await AcademyService.createAcademy(body);
    
    return NextResponse.json({ 
      message: 'Academy registered successfully. Please check your email to login.', 
      ...result 
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Registration failed' }, { status: 400 });
  }
}
