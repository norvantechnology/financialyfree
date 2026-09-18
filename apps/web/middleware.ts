import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected route prefixes - any path starting with these requires auth.
 * The middleware runs on the Edge runtime and reads the `accessToken` cookie
 * (which auth-client.ts syncs from localStorage on every login).
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/techno-funda',
  '/options-lab',
  '/kyc',
  '/courses',
  '/checkout',
  '/admin',
];

/**
 * Auth-only routes - redirect already-logged-in users away from these.
 */
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

/**
 * Lightweight JWT expiry check - no crypto needed, just decode the payload.
 * Returns true if the token is present and not expired.
 */
function isTokenValid(rawToken: string): boolean {
  try {
    // Cookies may be URI-encoded when set from document.cookie
    const token = decodeURIComponent(rawToken);
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (base64.length % 4)) % 4;
    const payload = JSON.parse(atob(base64 + '='.repeat(pad)));
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API proxy
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- 1. Check if this is a protected route ---
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // --- 2. Check if this is an auth-only route ---
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Read the access token cookie (synced by auth-client.ts on login)
  const accessToken = request.cookies.get('accessToken')?.value;
  const hasValidAccess = accessToken ? isTokenValid(accessToken) : false;

  // Refresh token must also be unexpired - expired cookies must not keep the user "logged in"
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const hasValidRefresh = refreshToken ? isTokenValid(refreshToken) : false;
  const isAuthenticated = hasValidAccess || hasValidRefresh;

  // --- 3. Protect dashboard/app routes ---
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    // Drop stale cookies so the browser does not keep sending expired tokens
    if (accessToken && !hasValidAccess) {
      response.cookies.set('accessToken', '', { path: '/', maxAge: 0 });
    }
    if (refreshToken && !hasValidRefresh) {
      response.cookies.set('refreshToken', '', { path: '/', maxAge: 0 });
    }
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }

  // --- 4. Redirect logged-in users away from auth pages ---
  if (isAuthRoute && isAuthenticated) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    const destination =
      callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('/auth')
        ? callbackUrl
        : '/dashboard/goals';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
};
