import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Allow Vercel preview URLs and Localhost to act as the root domain for testing
  const isVercel = hostname.endsWith('.vercel.app');
  const isLocal = hostname.includes('localhost');
  
  // Determine the base domain dynamically
  let baseDomain = 'furstops.com';
  if (isLocal) baseDomain = hostname; 
  if (isVercel) baseDomain = hostname;

  // 1. Root Domain (Marketing & Intake)
  // If we are on the exact root domain, let it load the intake form normally
  if (hostname === baseDomain) {
    return NextResponse.next();
  }

  // Extract the subdomain (e.g., "dognotoes" from "dognotoes.furstops.com")
  const currentHost = hostname.replace(`.${baseDomain}`, '');

  // 2. Admin Portal Subdomain
  // E.g., app.furstops.com -> secretly rewrites to the /admin folder
  if (currentHost === 'app') {
    return NextResponse.rewrite(new URL(`/admin${url.pathname}`, req.url));
  }

  // 3. Wildcard Tenant Subdomains
  // E.g., dognotoes.furstops.com -> secretly rewrites to /maps/dognotoes
  return NextResponse.rewrite(new URL(`/maps/${currentHost}${url.pathname}`, req.url));
}

// This configuration ensures the middleware doesn't run on background system files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};