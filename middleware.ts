import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/esqueci-senha', '/redefinir-senha', '/api/auth', '/api/health', '/_next', '/favicon'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession =
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token') ||
    req.cookies.has('__Host-authjs.session-token');

  console.log('[middleware] pathname:', pathname, 'hasSession:', hasSession);

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
