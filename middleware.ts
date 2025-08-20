import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    try {
      const token = req.nextauth.token
      const pathname = req.nextUrl.pathname

      // Allow access to login page
      if (pathname === "/login") {
        return NextResponse.next()
      }

      // Redirect to login if not authenticated
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url))
      }

      // Check admin access for admin routes
      if (pathname.startsWith("/admin")) {
        if (!token.permissions?.admin) {
          return NextResponse.redirect(new URL("/tools?error=unauthorized", req.url))
        }
      }

      // Check analytics access
      if (pathname.startsWith("/analytics")) {
        if (!token.permissions?.analytics) {
          return NextResponse.redirect(new URL("/tools?error=no-analytics-access", req.url))
        }
      }

      // Check appeal codes access
      if (pathname.startsWith("/appeal-codes")) {
        if (!token.permissions?.appealCodes) {
          return NextResponse.redirect(new URL("/tools?error=no-appeal-codes-access", req.url))
        }
      }

      return NextResponse.next()
    } catch (error) {
      console.error("Middleware error:", error)
      // Allow the request to continue on error to prevent total failure
      return NextResponse.next()
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        try {
          const { pathname } = req.nextUrl

          // Always allow access to login page
          if (pathname === "/login") {
            return true
          }

          // Require authentication for all other pages
          return !!token
        } catch (error) {
          console.error("Auth callback error:", error)
          return false
        }
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
  runtime: 'nodejs'
}