/**
 * Next.js middleware for route protection
 * Ensures admin routes are only accessible to OPERATOR role
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminRoute, requireRole } from './lib/auth';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect admin routes
  if (isAdminRoute(pathname)) {
    // In production, check actual auth token/JWT
    // For now, check localStorage (client-side) or header
    const userRole = request.headers.get('X-User-Role') || 'BUYER';

    if (userRole !== 'OPERATOR') {
      // Redirect to unauthorized or home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
