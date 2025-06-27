import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    // Match all paths except those starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico, robots.txt, sitemap.xml (common public files)
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

export default function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'flashpointqr.com';
  const currentHost = hostname.replace(`.${rootDomain}`, '');
  const isLocalhost = hostname.includes('localhost');
  
  // Public pages that don't require authentication or subdomain checking
  const publicPages = ['/login', '/register', '/forgot-password'];
  const isPublicPage = publicPages.some(page => url.pathname.startsWith(page));
  
  // Special handling for localhost development
  if (isLocalhost) {
    // For root path in local development
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
  
  // If it's the root domain, show marketing site or redirect to login
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    // Marketing site paths - don't redirect
    const marketingPages = ['/', '/pricing', '/features', '/contact', '/about'];
    const isMarketingPage = marketingPages.some(page => url.pathname === page);
    
    if (isMarketingPage || isPublicPage) {
      return NextResponse.next();
    }
    
    // For other paths on root domain, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If we're on a restaurant subdomain
  if (currentHost !== 'www' && currentHost !== 'app') {
    // Allow public pages on any domain
    if (isPublicPage) {
      return NextResponse.next();
    }
    
    // For customer-facing pages on restaurant subdomains
    if (url.pathname.startsWith('/menu') || url.pathname === '/') {
      // Rewrite to /restaurants/[subdomain]/menu
      return NextResponse.rewrite(
        new URL(`/restaurants/${currentHost}${url.pathname}`, request.url)
      );
    }
    
    // For authenticated restaurant staff pages
    if (
      url.pathname.startsWith('/dashboard') || 
      url.pathname.startsWith('/settings') || 
      url.pathname.startsWith('/orders') || 
      url.pathname.startsWith('/kitchen')
    ) {
      // Rewrite to dashboard with subdomain context
      return NextResponse.rewrite(
        new URL(`/dashboard/${currentHost}${url.pathname.replace('/dashboard', '')}`, request.url)
      );
    }
  }
  
  // If no conditions matched, just proceed
  return NextResponse.next();
}
