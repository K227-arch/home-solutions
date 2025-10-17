import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Rate limiting implementation
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const req = request;
  // Initialize a response to attach cookies set by Supabase
  const res = new NextResponse();

  // Rate limiting check
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const ipData = ipRequestCounts.get(ip) || { count: 0, timestamp: now };
  
  // Reset count if window has passed
  if (now - ipData.timestamp > WINDOW_MS) {
    ipData.count = 0;
    ipData.timestamp = now;
  }
  
  // Check if rate limit exceeded
  if (ipData.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429, headers: res.headers }
    );
  }
  
  // Increment request count
  ipData.count += 1;
  ipRequestCounts.set(ip, ipData);
  
  try {
    const body = await req.json();
    
    // Validate request body
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400, headers: res.headers }
      );
    }
    
    // Initialize Supabase client with request/response cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => req.cookies.get(name)?.value,
          set: (name: string, value: string, options: Record<string, unknown>) => {
            res.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: Record<string, unknown>) => {
            res.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Login user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    
    if (error) {
      // Log failed login for audit purposes (no user_id available)
      try {
        await supabase.from('auth_audit_log').insert({
          action: 'login_failed',
          ip_address: ip,
          user_agent: req.headers.get('user-agent') || 'unknown',
          metadata: { reason: error.message, email: body.email },
        });
      } catch (logErr) {
        console.error('Audit log insert failed (login_failed):', logErr);
      }
      return NextResponse.json(
        { error: 'Invalid login credentials' },
        { status: 401, headers: res.headers }
      );
    }
    
    // Log successful login for audit purposes
    await supabase.from('auth_audit_log').insert({
      user_id: data.user.id,
      action: 'login',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || 'unknown',
    });
    
    return NextResponse.json(
      { 
        message: 'Login successful',
        user: data.user,
      },
      { status: 200, headers: res.headers }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: res.headers }
    );
  }
}