import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/admin/login';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const response = await fetch(`${apiBase}/admin/auth/me`, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      return NextResponse.next();
    }
  } catch {
    // Fall through and redirect to login.
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.searchParams.set('next', pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
