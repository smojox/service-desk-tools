import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware completely for these paths - be very explicit
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.') ||
    pathname === '/_vercel'
  ) {
    return NextResponse.next()
  }

  // Public paths that don't need authentication
  const publicPaths = ['/login', '/']
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // For edge runtime compatibility - avoid process.env access
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.next()
  }

  // Simple session check using cookie presence instead of getToken
  const sessionToken = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token')
  
  if (!sessionToken) {
    // Redirect to login if no session
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}