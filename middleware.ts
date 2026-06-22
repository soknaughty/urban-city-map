import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Clean the hostname by stripping out ports (essential for local testing)
  const cleanHostname = hostname.split(':')[0];

  // Define our production root domain
  const baseDomain = 'furstops.com';

  // Check if we are running locally or on a Vercel preview domain
  const isLocal = cleanHostname.includes('localhost');
  const isVercelPreview = cleanHostname.endsWith('.vercel.app');

  // 1. handle LOCALHOST & VERCEL PREVIEW DEVELOPMENT PATHS
  if (isLocal || isVercelPreview) {
    // Allow standard sub-paths like /admin to bypass directly during previews
    if (url.pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    // If no explicit subdomain exists on local/preview, let the main form load
    if (!cleanHostname.startsWith('app.') && !cleanHostname.startsWith('dognotoes.')) {
      return NextResponse.next();
    }
  }

  // 2. PRODUCTION ROOT DOMAIN (furstops.com or www.furstops.com)
  if (cleanHostname === baseDomain || cleanHostname === `www.${baseDomain}`) {
    // If someone types furstops.com/admin, let them through to the dashboard layout
    if (url.pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    // Otherwise, show the global landing page intake forms
    return NextResponse.next();
  }

  // 3. PRODUCTION ADMIN PORTAL SUBDOMAIN (app.furstops.com)
  if (cleanHostname === `app.${baseDomain}`) {
    return NextResponse.rewrite(new URL(`/admin${url.pathname}`, req.url));
  }

  // 4. PRODUCTION WILDCARD TENANT SUBDOMAINS (e.g., dognotoes.furstops.com)
  const subdomain = cleanHostname.replace(`.${baseDomain}`, '');
  return NextResponse.rewrite(new URL(`/maps/${subdomain}${url.pathname}`, req.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};