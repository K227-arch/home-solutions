import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Rate limiting implementation (independent from login)
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const req = request;
  // Initialize a response to attach cookies set by Supabase
  const res = new NextResponse();

  // Rate limiting check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const ipData = ipRequestCounts.get(ip) || { count: 0, timestamp: now };
  if (now - ipData.timestamp > WINDOW_MS) {
    ipData.count = 0;
    ipData.timestamp = now;
  }
  if (ipData.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429, headers: res.headers }
    );
  }
  ipData.count += 1;
  ipRequestCounts.set(ip, ipData);

  try {
    const body = await req.json();
    const result = forgotSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400, headers: res.headers }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => req.cookies.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            res.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: any) => {
            res.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      : new URL('/reset-password', req.url).toString();

    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: redirectUrl,
    });

    // Log request regardless of whether account exists (no user_id here)
    try {
      await supabase.from('auth_audit_log').insert({
        action: 'password_reset_requested',
        ip_address: ip,
        user_agent: req.headers.get('user-agent') || 'unknown',
        metadata: { email: body.email, redirectTo: redirectUrl },
      });
    } catch (logErr) {
      console.error('Audit log insert failed (password_reset_requested):', logErr);
    }

    // Avoid leaking existence of account
    return NextResponse.json(
      { message: 'If an account exists, a reset link has been sent.' },
      { status: 200, headers: res.headers }
    );
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: res.headers }
    );
  }
}