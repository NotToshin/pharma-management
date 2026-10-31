/**
 * Centralized API URL Resolver and Endpoint Helper
 * 
 * Configures the backend API URL dynamically from environment variables.
 * Guarantees that `/api` is always present at the end of the base URL,
 * stripping trailing slashes and preventing missing or duplicate `/api` path segments.
 */

/**
 * Normalizes and returns the backend API base URL from process.env.NEXT_PUBLIC_API_URL.
 * Safely falls back to "http://localhost:5000/api" when unset to prevent build-time evaluation crashes.
 */
export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000/api";

  // Strip trailing slashes
  let cleanUrl = envUrl.replace(/\/+$/, "");

  // Ensure /api is at the end of base URL
  if (!cleanUrl.endsWith("/api")) {
    cleanUrl = `${cleanUrl}/api`;
  }

  return cleanUrl;
}

/**
 * Exported constant for direct usage: `${API_URL}/orders`
 */
export const API_URL = getApiUrl();

/**
 * Safely constructs a complete API endpoint URL.
 * Prevents missing or duplicate `/api` prefixes and extra slashes.
 * 
 * Usage examples:
 * - getEndpoint("/orders") -> "http://localhost:5000/api/orders"
 * - getEndpoint("orders") -> "http://localhost:5000/api/orders"
 * - getEndpoint("/api/orders") -> "http://localhost:5000/api/orders"
 */
export function getEndpoint(path: string): string {
  const baseUrl = getApiUrl();
  let cleanPath = path ? path.trim() : "";

  // Strip leading "/api/" or exact "/api" to prevent /api/api duplication
  if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.substring(5);
  } else if (cleanPath === "/api") {
    cleanPath = "";
  } else if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath === "api") {
    cleanPath = "";
  }

  // Strip all leading slashes
  cleanPath = cleanPath.replace(/^\/+/, "");

  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
}

import { getAccessToken, getStoredRefreshToken, getStoredUser, isTokenExpired, setAuthSession } from "./auth";

let refreshInFlight: Promise<string | null> | null = null;

function handleSessionExpiry() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;

  if (typeof document !== "undefined") {
    document.cookie = "ak_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    document.cookie = "accessToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    document.cookie = "refreshToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  }
  localStorage.removeItem("user");
  localStorage.removeItem("ak_user");
  localStorage.removeItem("token");
  localStorage.removeItem("ak_token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("ak_refreshToken");
  const from = window.location.pathname + window.location.search;
  const next = from.startsWith("/login") ? "/login?expired=1" : `/login?expired=1&from=${encodeURIComponent(from)}`;
  window.location.href = next;
}

async function requestFreshAccessToken(): Promise<string | null> {
  const storedRefreshToken = getStoredRefreshToken();
  if (!storedRefreshToken) {
    handleSessionExpiry();
    return null;
  }

  const refreshRes = await fetch(`${getApiUrl()}/auth/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: storedRefreshToken }),
  });

  if (!refreshRes.ok) {
    if (refreshRes.status === 401 || refreshRes.status === 403) {
      handleSessionExpiry();
    }
    return null;
  }

  const refreshJson = await refreshRes.json().catch(() => null);
  const payload = refreshJson?.data || refreshJson;
  const newAccessToken = payload?.accessToken as string | undefined;
  const newRefreshToken = payload?.refreshToken as string | undefined;
  const updatedUser = payload?.user;

  if (!newAccessToken) return null;

  setAuthSession({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken || storedRefreshToken,
    user: updatedUser || getStoredUser() || undefined,
  });

  return newAccessToken;
}

/**
 * One shared refresh for every caller. Opening a page that fires several
 * requests at once must not rotate the refresh token more than once.
 */
export function ensureFreshAccessToken(force = false): Promise<string | null> {
  const current = typeof window !== "undefined" ? getAccessToken() : null;
  if (!force && current && !isTokenExpired(current)) {
    return Promise.resolve(current);
  }

  if (!refreshInFlight) {
    refreshInFlight = requestFreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

/**
 * Universal fetch interceptor with:
 * - dual authorization support (Authorization header + HttpOnly cookies)
 * - automatic 401 interception
 * - single-flight silent refresh token rotation (with fallback body transmission)
 * - request queueing for concurrent 401s
 * - automatic retry of failed requests with rotated token
 * - logout & redirect fallback only on ultimate session invalidation
 */
export async function apiFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const targetUrl = typeof input === "string" && !input.startsWith("http") ? getEndpoint(input) : input;
  const urlString = typeof targetUrl === "string" ? targetUrl : targetUrl.toString();
  const isAuthCall = urlString.includes("/auth/refresh-token") || urlString.includes("/auth/login");

  if (!isAuthCall && typeof window !== "undefined") {
    const freshToken = await ensureFreshAccessToken();
    if (!freshToken) {
      return new Response(JSON.stringify({ success: false, message: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const token = typeof window !== "undefined" ? getAccessToken() : null;
  const storedUser = typeof window !== "undefined" ? getStoredUser() : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (storedUser) {
    if (storedUser.email && !headers["x-user-email"]) {
      headers["x-user-email"] = storedUser.email;
    }
    if (storedUser.name && !headers["x-user-name"]) {
      headers["x-user-name"] = storedUser.name;
    }
    const userRole = storedUser.role || (storedUser as any).roleCode || (storedUser as any).roleName;
    if (userRole && !headers["x-user-role"]) {
      headers["x-user-role"] = userRole;
    }
  }

  const requestInit: RequestInit = {
    credentials: "include",
    ...init,
    headers,
  };

  const response = await fetch(targetUrl, requestInit);

  if (response.status !== 401 || isAuthCall) {
    return response;
  }

  // Access token was rejected after the preflight check. Refresh once and retry.
  const newAccessToken = await ensureFreshAccessToken(true);
  if (!newAccessToken) {
    return response;
  }

  const retryHeaders: Record<string, string> = {
    ...headers,
    Authorization: `Bearer ${newAccessToken}`,
  };

  return fetch(targetUrl, {
    ...requestInit,
    headers: retryHeaders,
  });
}

export default API_URL;
