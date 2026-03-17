import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import config from './config';

export async function getServerUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, config.jwtSecret);
    return decoded.user;
  } catch {
    return null;
  }
}

export async function authenticate(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return null;
  return { user };
}

export function authorize(...allowedRoles: string[]) {
  return async (req: NextRequest) => {
    const auth = await authenticate(req);
    if (!auth) return null;
    if (allowedRoles.length > 0 && !allowedRoles.includes(auth.user.role)) {
      return null;
    }
    return auth;
  };
}

export function authResponse(message: string, status = 401) {
  return NextResponse.json({ message }, { status });
}
