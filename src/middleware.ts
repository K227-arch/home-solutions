import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { corsMiddleware } from './lib/cors';
// CSRF protection disabled per configuration
import { rateLimitMiddleware } from './lib/rate-limit';

export async function middleware(req: NextRequest) {
  // Initialize response
  let res = NextResponse.next();
  
  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(req);
  if (rateLimitResponse.status !== 200) {
    return rateLimitResponse;
  }
  
  // Apply CORS
  res = corsMiddleware(req, res);
  
  // CSRF protection disabled: allow mutation requests without token validation
  
  // Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if this is an admin route
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  
  // If accessing admin routes, check for admin role
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Get user role from user metadata or a custom claim
    const { data: userData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (!userData || userData.role !== 'admin') {
      // Redirect non-admin users to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  // Check if this is a protected route
  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith('/dashboard') || 
    req.nextUrl.pathname.startsWith('/profile');
  
  // If accessing protected routes without session, redirect to login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // If accessing auth routes with session, redirect based on role
  if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup') && session) {
    let redirectPath = '/dashboard';
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      if (roleData?.role === 'admin') {
        redirectPath = '/admin';
      }
    } catch {
      // Fallback to dashboard on any error
      redirectPath = '/dashboard';
    }
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/login',
    '/signup',
    '/api/:path*',
  ],
};