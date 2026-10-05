import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Checks if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  if (!token) return true
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return true

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const decoded = JSON.parse(jsonPayload)

    if (!decoded.exp) return false
    return decoded.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Bypass static files, internal Next.js assets, and Next API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // 2. Read access token from cookies
  const accessTokenCookie =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("token")?.value ||
    request.cookies.get("ak_token")?.value

  const hasValidSession = Boolean(
    accessTokenCookie && !isTokenExpired(accessTokenCookie)
  )
  const isLoginPage = pathname === "/login"
  const isRootPage = pathname === "/"

  // 3. Root landing page handling
  if (isRootPage) {
    if (hasValidSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 4. Authenticated user visiting /login -> redirect directly to /dashboard
  if (isLoginPage) {
    if (hasValidSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // 5. Unauthenticated user trying to access protected routes -> redirect to /login
  if (!hasValidSession) {
    const loginUrl = new URL("/login", request.url)
    if (pathname && pathname !== "/dashboard") {
      loginUrl.searchParams.set("from", pathname)
    }
    if (accessTokenCookie && isTokenExpired(accessTokenCookie)) {
      loginUrl.searchParams.set("expired", "1")
    }

    const response = NextResponse.redirect(loginUrl)

    // Invalidate expired cookie on the response
    if (accessTokenCookie) {
      response.cookies.delete("accessToken")
      response.cookies.delete("token")
      response.cookies.delete("ak_token")
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
