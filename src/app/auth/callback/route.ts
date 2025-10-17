import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    // Create a response to attach cookies set by Supabase
    const res = new NextResponse();

    if (code) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Auth callback: Missing Supabase environment variables');
        return NextResponse.redirect(new URL('/login?error=supabase_config', request.url), { headers: res.headers });
      }

      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
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

      // Attempt to exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error('Auth callback: exchangeCodeForSession failed', exchangeError);
      }

      // Ensure a profile row exists for this user (app-side upsert)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          const meta: any = session?.user?.user_metadata || {};
          const payload = {
            id: userId,
            full_name: meta.full_name ?? null,
            phone: meta.phone ?? null,
            address: meta.address ?? null,
          };
          await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
        }
      } catch (e) {
        console.error('Auth callback: profile upsert failed', e);
      }

      // Determine redirect target based on role
      let redirectPath = '/dashboard';
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();
          if (roleData?.role === 'admin') {
            redirectPath = '/admin';
          }
        }
      } catch (e) {
        // Fallback to dashboard on any error
        console.error('Auth callback: role lookup failed', e);
        redirectPath = '/dashboard';
      }

      return NextResponse.redirect(new URL(redirectPath, request.url), { headers: res.headers });
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL('/dashboard', request.url), { headers: res.headers });
  } catch (error) {
    console.error('Auth callback: unexpected error', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}