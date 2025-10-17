import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Create a response to attach cookies set by Supabase
  const res = new NextResponse();
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            res.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: any) => {
            res.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Log logout for audit purposes
      await supabase.from('auth_audit_log').insert({
        user_id: session.user.id,
        action: 'logout',
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });
    }
    
    // Sign out the user
    await supabase.auth.signOut();
    
    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200, headers: res.headers }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: res.headers }
    );
  }
}