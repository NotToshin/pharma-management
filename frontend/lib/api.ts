/**
 * Centralized API URL Resolver and Endpoint Helper
 * 
 * Configures the backend API URL dynamically from environment variables.
 * Guarantees that `/api` is always present at the end of the base URL,
 * stripping trailing slashes and preventing missing or duplicate `/api` path segments.
 */

/**
 * Normalizes and returns the backend API base URL from process.env.NEXT_PUBLIC_API_URL.
 * 
 * @throws {Error} if NEXT_PUBLIC_API_URL environment variable is missing or empty.
 */
export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!envUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL environment variable is missing. Please add NEXT_PUBLIC_API_URL=http://localhost:5000/api to your .env.local file and restart the dev server."
    );
  }

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

import { getAccessToken, getStoredRefreshToken, getStoredUser, setAuthSession } from "./auth";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (res: Response | Promise<Response>) => void;
  reject: (err: any) => void;
  targetUrl: string | URL | Request;
  requestInit: RequestInit;
}> = [];

const processQueue = (success: boolean, newAccessToken?: string) => {
  failedQueue.forEach(({ resolve, reject, targetUrl, requestInit }) => {
    if (success) {
      const retryHeaders: Record<string, string> = {
        ...(requestInit.headers as Record<string, string>),
      };
      if (newAccessToken) {
        retryHeaders["Authorization"] = `Bearer ${newAccessToken}`;
      }
      resolve(fetch(targetUrl, { ...requestInit, headers: retryHeaders }));
    } else {
      reject(new Error("Authentication session expired"));
    }
  });
  failedQueue = [];
};

function handleSessionExpiry() {
  if (typeof document !== "undefined") {
    document.cookie = "ak_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    document.cookie = "accessToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    document.cookie = "refreshToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
    localStorage.removeItem("ak_user");
    localStorage.removeItem("token");
    localStorage.removeItem("ak_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("ak_refreshToken");
    window.location.href = "/login?expired=1";
  }
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
  const token = typeof window !== "undefined" ? getAccessToken() : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestInit: RequestInit = {
    credentials: "include",
    ...init,
    headers,
  };

  const response = await fetch(targetUrl, requestInit);

  // If response is not 401 Unauthorized, return immediately
  if (response.status !== 401) {
    return response;
  }

  const urlString = typeof targetUrl === "string" ? targetUrl : targetUrl.toString();

  // If the 401 came from the login or refresh-token endpoint itself, do not loop
  if (urlString.includes("/auth/refresh-token") || urlString.includes("/auth/login")) {
    handleSessionExpiry();
    return response;
  }

  // If a refresh is already in flight, queue this request until refresh finishes
  if (isRefreshing) {
    return new Promise<Response>((resolve, reject) => {
      failedQueue.push({ resolve, reject, targetUrl, requestInit });
    });
  }

  // First 401 initiates single-flight refresh request
  isRefreshing = true;

  try {
    const storedRefreshToken = typeof window !== "undefined" ? getStoredRefreshToken() : null;

    const refreshRes = await fetch(`${getApiUrl()}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (refreshRes.ok) {
      const refreshJson = await refreshRes.json().catch(() => null);
      const payload = refreshJson?.data || refreshJson;
      const newAccessToken = payload?.accessToken;
      const newRefreshToken = payload?.refreshToken;
      const updatedUser = payload?.user;

      if (newAccessToken) {
        setAuthSession({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || storedRefreshToken || undefined,
          user: updatedUser || getStoredUser() || undefined,
        });
      }

      processQueue(true, newAccessToken);

      // Seamlessly retry the original paused request with new authorization header
      const retryHeaders: Record<string, string> = {
        ...headers,
      };
      if (newAccessToken) {
        retryHeaders["Authorization"] = `Bearer ${newAccessToken}`;
      }

      return await fetch(targetUrl, {
        ...requestInit,
        headers: retryHeaders,
      });
    } else {
      processQueue(false);
      handleSessionExpiry();
      return response;
    }
  } catch (error) {
    processQueue(false);
    handleSessionExpiry();
    throw error;
  } finally {
    isRefreshing = false;
  }
}

export default API_URL;
