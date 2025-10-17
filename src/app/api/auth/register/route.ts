import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Rate limiting implementation
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

// Validation schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  // Create a response to attach cookies set by Supabase
  const res = new NextResponse();

  // Rate limiting check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
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
    const body = await request.json();
    
    // Validate request body
    const result = registerSchema.safeParse(body);
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
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: Record<string, unknown>) => {
            res.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: Record<string, unknown>) => {
            res.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Register user
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: res.headers }
      );
    }

    return NextResponse.json(
      { 
        message: 'Registration successful. Please check your email to confirm your account.',
        user: data.user
      },
      { status: 201, headers: res.headers }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: res.headers }
    );
  }
}