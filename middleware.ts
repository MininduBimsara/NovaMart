import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require authentication
const protectedRoutes = ["/products", "/cart", "/checkout", "/orders", "/profile"]

// Define public routes that don't require authentication
const publicRoutes = ["/", "/login", "/logout"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.includes(pathname)

  // For protected routes, we'll let the client-side AuthGuard handle the authentication
  // This middleware is mainly for future server-side authentication if needed
  if (isProtectedRoute) {
    // You can add server-side token validation here if needed
    // For now, we'll let the client-side handle it
    return NextResponse.next()
  }

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For any other routes, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
