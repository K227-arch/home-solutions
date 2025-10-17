import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
// Note: In production, use Redis or another distributed store
type RateLimitStore = Map<string, { count: number; timestamp: number }>;

export class RateLimiter {
  private store: RateLimitStore;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.store = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const record = this.store.get(key) || { count: 0, timestamp: now };

    // Reset if window has passed
    if (now - record.timestamp > this.windowMs) {
      record.count = 0;
      record.timestamp = now;
    }

    // Check if limit exceeded
    if (record.count >= this.maxRequests) {
      return false;
    }

    // Increment and store
    record.count += 1;
    this.store.set(key, record);
    return true;
  }

  // Clean up old entries
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now - record.timestamp > this.windowMs) {
        this.store.delete(key);
      }
    }
  }
}

// Create rate limiters for different endpoints
const authLimiter = new RateLimiter(5, 60 * 1000); // 5 requests per minute
const apiLimiter = new RateLimiter(20, 60 * 1000); // 20 requests per minute

// Middleware function for rate limiting
export function rateLimitMiddleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const path = req.nextUrl.pathname;
  
  // Select appropriate limiter based on path
  let limiter: RateLimiter;
  if (path.startsWith('/api/auth')) {
    limiter = authLimiter;
  } else {
    limiter = apiLimiter;
  }
  
  // Check rate limit
  if (!limiter.check(ip)) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429 }
    );
  }
  
  return NextResponse.next();
}