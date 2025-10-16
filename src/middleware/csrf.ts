import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// CSRF protection middleware
export function csrfMiddleware(req: NextRequest) {
  // Skip for non-mutation methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return NextResponse.next();
  }

  // Check CSRF token for mutation requests
  const csrfToken = req.headers.get('x-csrf-token');
  const csrfCookie = req.cookies.get('csrf-token')?.value;

  // If no CSRF token or cookie, or they don't match, reject the request
  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

// Generate CSRF token for forms
export function generateCsrfToken(res: NextResponse): string {
  const token = nanoid(32);
  
  // Set CSRF token in cookie
  res.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  
  return token;
}