import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const cleanHostname = hostname.split(':')[0];
  const baseDomain = 'furstops.com';

  const isLocal = cleanHostname.includes('localhost');
  const isVercelPreview = cleanHostname.endsWith('.vercel.app');

  // 1. LOCAL & PREVIEW PATHS
  if (isLocal || isVercelPreview) {
    if (url.pathname.startsWith('/admin')) return NextResponse.next();
    if (!cleanHostname.startsWith('app.') && !cleanHostname.startsWith('dognotoes.')) {
      return NextResponse.next();
    }
  }

  // 2. PRODUCTION ROOT DOMAIN (Marketing Landing Page)
  if (cleanHostname === baseDomain || cleanHostname === `www.${baseDomain}`) {
    if (url.pathname.startsWith('/admin')) return NextResponse.next();
    return NextResponse.next();
  }

  // 3. PRODUCTION ADMIN PORTAL SUBDOMAIN (app.furstops.com)
  if (cleanHostname === `app.${baseDomain}`) {
    return NextResponse.rewrite(new URL(`/admin${url.pathname}`, req.url));
  }

  // 4. PRODUCTION WILDCARD TENANT MAPS (e.g., dognotoes.furstops.com)
  const subdomain = cleanHostname.replace(`.${baseDomain}`, '');
  return NextResponse.rewrite(new URL(`/map/${subdomain}${url.pathname}`, req.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};