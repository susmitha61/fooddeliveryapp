import { NextRequest, NextResponse } from 'next/server';

const ROLE_ROUTES: Record<string, string[]> = {
  '/owner': ['RESTAURANT_OWNER', 'ADMIN'],
  '/driver': ['DELIVERY_DRIVER', 'ADMIN'],
  '/manager': ['MANAGER', 'ADMIN'],
  '/admin': ['ADMIN'],
  '/checkout': ['CUSTOMER', 'ADMIN'],
  '/orders': ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN'],
  '/profile': ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN'],
  '/favourites': ['CUSTOMER', 'ADMIN'],
  '/payments': ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN'],
  '/support': ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN'],
};

function getUserFromCookies(request: NextRequest): { role: string; id?: string } | null {
  const raw = request.cookies.get('biterush_user')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('biterush_token')?.value;

  // Direct duplicate /restaurants route to canonical /browse
  if (pathname === '/restaurants') {
    return NextResponse.redirect(new URL('/browse', request.url));
  }

  const isAuthPage = pathname.startsWith('/auth');
  const isPublic =
    pathname === '/' ||
    isAuthPage ||
    pathname === '/browse' ||
    pathname.startsWith('/restaurants/') ||
    pathname === '/not-found';

  if (isPublic) {
    if (token && isAuthPage) {
      return NextResponse.redirect(new URL('/browse', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(
      new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url),
    );
  }

  const user = getUserFromCookies(request);

  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      // Fail closed: if user cookie/role is missing on protected route, redirect to login
      if (!user?.role) {
        return NextResponse.redirect(
          new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url)
        );
      }
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.redirect(new URL('/browse', request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
