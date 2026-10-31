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

/**
 * Safely extracts user role from token or cookie
 */
function getUserRole(token?: string, cookieRole?: string): string | null {
  if (cookieRole) return cookieRole
  if (!token) return null
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const decoded = JSON.parse(jsonPayload)
    return decoded.role || null
  } catch {
    return null
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

  // 2. Read session flag or access token from cookies
  const sessionFlag = request.cookies.get("ak_session")?.value
  const accessTokenCookie =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("token")?.value ||
    request.cookies.get("ak_token")?.value

  const refreshTokenCookie = request.cookies.get("refreshToken")?.value
  const hasRefreshSession = Boolean(
    refreshTokenCookie && !isTokenExpired(refreshTokenCookie)
  )
  // An expired access token is recoverable while the 7-day session or refresh token remains.
  const hasValidSession = Boolean(
    sessionFlag === "true" ||
    hasRefreshSession ||
    (accessTokenCookie && !isTokenExpired(accessTokenCookie))
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
    if (
      accessTokenCookie &&
      isTokenExpired(accessTokenCookie) &&
      !hasRefreshSession &&
      sessionFlag !== "true"
    ) {
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

  // 6. RBAC Route Protection: /settings/rbac is restricted to accounts with Super Admin or RBAC permission
  if (pathname.startsWith("/settings/rbac")) {
    const roleCookie = request.cookies.get("ak_role")?.value
    const rbacFlag = request.cookies.get("ak_rbac")?.value
    const userRole = getUserRole(accessTokenCookie, roleCookie)
    const normalizedRole = (userRole || "").replace(/[\s_]+/g, "").toUpperCase()

    // If role is detected and neither SUPERADMIN nor RBAC permitted, redirect to dashboard (keep session active, no logout)
    const isSuperAdminRole =
      normalizedRole.includes("SUPERADMIN") ||
      normalizedRole.includes("SUPERADMINISTRATOR")

    const hasClearance = isSuperAdminRole || rbacFlag === "true"

    if (normalizedRole && !hasClearance) {
      const redirectUrl = new URL("/dashboard", request.url)
      redirectUrl.searchParams.set("unauthorized", "rbac")
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
