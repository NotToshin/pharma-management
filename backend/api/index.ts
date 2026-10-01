import app from "../src/server";

export default function handler(req: any, res: any) {
  // 1. Recover the original URL requested by the browser
  const originalUrl =
    req.headers["x-matched-path"] ||
    req.headers["x-forwarded-uri"] ||
    req.url;

  // 2. If Vercel rewrote the URL to /api/index.ts or /index.ts, strip it back
  if (req.url && (req.url.startsWith("/api/index.ts") || req.url.startsWith("/index.ts"))) {
    try {
      const parsed = new URL(req.url, "http://localhost");
      const paramUrl = parsed.searchParams.get("__url");
      if (paramUrl) {
        parsed.searchParams.delete("__url");
        const remaining = parsed.searchParams.toString();
        req.url = remaining ? `${paramUrl}?${remaining}` : paramUrl;
      } else if (originalUrl && !originalUrl.includes("index.ts")) {
        req.url = originalUrl;
      }
    } catch {
      // fallback
    }
  }

  return app(req, res);
}
