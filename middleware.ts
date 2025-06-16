
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RATE_LIMIT = 100 // requests per minute
const rateLimitMap = new Map<string, number[]>()

export function middleware(request: NextRequest) {
  // Skip rate limiting for health checks
  if (request.nextUrl.pathname === '/health') {
    return NextResponse.next()
  }

  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const now = Date.now()
  const windowStart = now - 60 * 1000 // 1 minute window

  // Get existing requests for this IP
  const requests = rateLimitMap.get(ip) || []
  
  // Filter out old requests
  const recentRequests = requests.filter(timestamp => timestamp > windowStart)

  // Check if limit exceeded
  if (recentRequests.length >= RATE_LIMIT) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    })
  }

  // Add current request
  recentRequests.push(now)
  rateLimitMap.set(ip, recentRequests)

  // Clean up old entries periodically
  if (Math.random() < 0.1) { // 10% chance
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart)
      if (validTimestamps.length === 0) {
        rateLimitMap.delete(key)
      } else {
        rateLimitMap.set(key, validTimestamps)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
