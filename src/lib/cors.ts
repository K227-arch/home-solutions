import { NextRequest, NextResponse } from 'next/server';

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://yourdomain.com'] // Add your production domains
  : ['http://localhost:3000'];

export function corsMiddleware(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin');
  
  // Check if the origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    // Set CORS headers
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }
  
  return res;
}