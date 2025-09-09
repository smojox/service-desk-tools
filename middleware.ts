import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware completely for these paths
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Public paths that don't need authentication
  const publicPaths = ['/login']
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // For build time or when no secret is available, allow all
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Redirect to login if no token and not on root
    if (!token && pathname !== '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Redirect to tools if logged in and on login page
    if (token && pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/tools'
      return NextResponse.redirect(url)
    }

    // Check permissions for protected routes
    if (token) {
      if (pathname.startsWith('/admin') && !token.permissions?.admin) {
        const url = request.nextUrl.clone()
        url.pathname = '/tools'
        url.search = '?error=unauthorized'
        return NextResponse.redirect(url)
      }

      if (pathname.startsWith('/analytics') && !token.permissions?.analytics) {
        const url = request.nextUrl.clone()
        url.pathname = '/tools'
        url.search = '?error=no-analytics-access'
        return NextResponse.redirect(url)
      }

      if (pathname.startsWith('/appeal-codes') && !token.permissions?.appealCodes) {
        const url = request.nextUrl.clone()
        url.pathname = '/tools'
        url.search = '?error=no-appeal-codes-access'
        return NextResponse.redirect(url)
      }
    }

  } catch (error) {
    // In case of any error, just continue
    console.error('Middleware error:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}