/**
 * AK Pharma Authentication & Session Utilities
 * Provides cookie-based and local storage token management
 * compatible with Next.js Client Components, Server Components, and Edge Middleware.
 */

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  roleName?: string
  territory?: string
  status?: string
  avatar?: string
  permissions?: any[]
}

export interface AuthSessionData {
  accessToken: string
  refreshToken?: string
  user?: AuthUser
}

const COOKIE_ACCESS_TOKEN = "accessToken"
const COOKIE_TOKEN_ALIAS = "token"
const COOKIE_REFRESH_TOKEN = "refreshToken"

const STORAGE_TOKEN = "token"
const STORAGE_AK_TOKEN = "ak_token"
const STORAGE_USER = "user"
const STORAGE_AK_USER = "ak_user"

/**
 * Sets a browser cookie with standard security attributes
 */
export function setCookie(
  name: string,
  value: string,
  maxAgeSeconds: number = 7 * 24 * 60 * 60
) {
  if (typeof document === "undefined") return

  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:"
  const secureFlag = isSecure ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`
}

/**
 * Gets a cookie value by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const cookies = document.cookie ? document.cookie.split("; ") : []
  for (const cookie of cookies) {
    const [cookieName, ...cookieValParts] = cookie.split("=")
    if (cookieName.trim() === name) {
      return decodeURIComponent(cookieValParts.join("="))
    }
  }
  return null
}

/**
 * Deletes a cookie by name
 */
export function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

/**
 * Checks if a JWT token is expired (without heavy external libraries)
 */
export function isTokenExpired(token: string): boolean {
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
    // Buffer by 5 seconds
    return decoded.exp * 1000 <= Date.now() + 5000
  } catch {
    return true
  }
}

/**
 * Decodes user payload from JWT token
 */
export function decodeTokenPayload(token: string): any | null {
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
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Sets auth session across cookies and localStorage
 */
export function setAuthSession({
  accessToken,
  refreshToken,
  user,
}: AuthSessionData) {
  if (!accessToken) return

  // 1. Store Access Token in cookies (7 days or matching JWT expiry)
  const maxAge = 7 * 24 * 60 * 60 // 7 days
  setCookie(COOKIE_ACCESS_TOKEN, accessToken, maxAge)
  setCookie(COOKIE_TOKEN_ALIAS, accessToken, maxAge)

  if (refreshToken) {
    setCookie(COOKIE_REFRESH_TOKEN, refreshToken, 30 * 24 * 60 * 60)
  }

  // 2. Also keep localStorage in sync for fast synchronous hydration and legacy helpers
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_TOKEN, accessToken)
    localStorage.setItem(STORAGE_AK_TOKEN, accessToken)

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken)
    }

    if (user) {
      const userJson = JSON.stringify(user)
      localStorage.setItem(STORAGE_USER, userJson)
      localStorage.setItem(STORAGE_AK_USER, userJson)
    }
  }
}

/**
 * Retrieves the current access token from cookies or localStorage
 */
export function getAccessToken(): string | null {
  // Check cookie first
  const cookieToken =
    getCookie(COOKIE_ACCESS_TOKEN) || getCookie(COOKIE_TOKEN_ALIAS)
  if (cookieToken) return cookieToken

  // Fallback to localStorage if in browser
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem(STORAGE_TOKEN) ||
      localStorage.getItem(STORAGE_AK_TOKEN) ||
      null
    )
  }
  return null
}

/**
 * Retrieves the currently stored user profile
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null

  try {
    const raw =
      localStorage.getItem(STORAGE_USER) ||
      localStorage.getItem(STORAGE_AK_USER)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Checks whether user currently has a valid, non-expired session
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken()
  if (!token) return false
  return !isTokenExpired(token)
}

/**
 * Clears all auth session data from cookies and localStorage
 */
export function clearAuthSession() {
  // Clear cookies
  deleteCookie(COOKIE_ACCESS_TOKEN)
  deleteCookie(COOKIE_TOKEN_ALIAS)
  deleteCookie(COOKIE_REFRESH_TOKEN)

  // Clear localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_AK_TOKEN)
    localStorage.removeItem(STORAGE_USER)
    localStorage.removeItem(STORAGE_AK_USER)
    localStorage.removeItem("refreshToken")
  }
}

/**
 * Fully logs out user, notifies backend if available, and redirects to /login
 */
export async function logout(apiUrl?: string) {
  try {
    const baseApi =
      apiUrl ||
      (process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
        : "http://localhost:5000/api")

    // Optional fire-and-forget call to backend to invalidate refresh token
    fetch(`${baseApi}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => null)
  } catch {
    // Non-blocking
  } finally {
    clearAuthSession()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }
}
