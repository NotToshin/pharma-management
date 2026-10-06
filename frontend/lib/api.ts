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

export default API_URL;
