import app from "../backend/src/server";

export default function handler(req: any, res: any) {
  // If Vercel rewrote the path to /api/index.ts, restore the original requested URL
  if (req.url && (req.url.startsWith("/api/index.ts") || req.url.startsWith("/index.ts"))) {
    try {
      const parsed = new URL(req.url, "http://localhost");
      const target = parsed.searchParams.get("__url");
      if (target) {
        parsed.searchParams.delete("__url");
        const remainingQuery = parsed.searchParams.toString();
        req.url = remainingQuery ? `${target}?${remainingQuery}` : target;
      } else if (req.headers["x-forwarded-uri"]) {
        req.url = req.headers["x-forwarded-uri"] as string;
      }
    } catch (err) {
      console.error("URL restoration error:", err);
    }
  }

  return app(req, res);
}
