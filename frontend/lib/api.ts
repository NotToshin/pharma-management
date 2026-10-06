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

let isRefreshing = false;
let failedQueue: Array<(success: boolean) => void> = [];

const processQueue = (success: boolean) => {
  failedQueue.forEach((callback) => callback(success));
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
    window.location.href = "/login?expired=1";
  }
}

/**
 * Universal fetch interceptor with:
 * - cross-origin HttpOnly cookie credentials
 * - automatic 401 interception
 * - single-flight silent refresh token rotation
 * - request queueing for concurrent 401s
 * - automatic retry of failed requests
 * - logout & redirect fallback on session invalidation
 */
export async function apiFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const targetUrl = typeof input === "string" && !input.startsWith("http") ? getEndpoint(input) : input;
  const requestInit: RequestInit = {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
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
      failedQueue.push((success) => {
        if (success) {
          resolve(fetch(targetUrl, requestInit));
        } else {
          reject(new Error("Authentication session expired"));
        }
      });
    });
  }

  // First 401 initiates single-flight refresh request
  isRefreshing = true;

  try {
    const refreshRes = await fetch(`${getApiUrl()}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (refreshRes.ok) {
      processQueue(true);
      // Seamlessly retry the original paused request
      return await fetch(targetUrl, requestInit);
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
