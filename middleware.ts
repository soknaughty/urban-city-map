import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Determine if we are on local development or live production
  const isLocal = process.env.NODE_ENV === 'development';
  const baseDomain = isLocal ? 'localhost:3000' : 'furstops.com';

  // Extract the subdomain (e.g., "dognotoes" from "dognotoes.furstops.com")
  const currentHost = hostname.replace(`.${baseDomain}`, '');

  // 1. Root Domain (Marketing & Intake)
  // E.g., furstops.com or localhost:3000
  if (hostname === baseDomain) {
    // We will route the root domain to a dedicated (marketing) folder later,
    // but for now, we just let it pass through normally.
    return NextResponse.next();
  }

  // 2. Admin Portal Subdomain
  // E.g., app.furstops.com or app.localhost:3000
  if (currentHost === 'app' || url.pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL(`/app/admin${url.pathname}`, req.url));
  }

  // 3. Wildcard Tenant Subdomains
  // E.g., dognotoes.furstops.com
  // If it is not the root domain and not 'app', we assume it's a tenant map!
  return NextResponse.rewrite(new URL(`/app/maps/${currentHost}${url.pathname}`, req.url));
}

// This configuration ensures the middleware doesn't run on background system files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};