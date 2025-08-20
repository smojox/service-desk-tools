import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth']
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Get the JWT token to check authentication
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is authenticated and trying to access login page
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/tools', request.url))
  }

  // If authenticated, check permissions for protected routes
  if (token) {
    // Check admin access for admin routes
    if (pathname.startsWith("/admin")) {
      if (!token.permissions?.admin) {
        return NextResponse.redirect(new URL("/tools?error=unauthorized", request.url))
      }
    }

    // Check analytics access
    if (pathname.startsWith("/analytics")) {
      if (!token.permissions?.analytics) {
        return NextResponse.redirect(new URL("/tools?error=no-analytics-access", request.url))
      }
    }

    // Check appeal codes access
    if (pathname.startsWith("/appeal-codes")) {
      if (!token.permissions?.appealCodes) {
        return NextResponse.redirect(new URL("/tools?error=no-appeal-codes-access", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp).*)'],
}