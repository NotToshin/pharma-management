import express, { Application, Request, Response } from "express";
import cors from "cors";
import doctorRoutes from "./routes/doctorRoutes";
import staffRoutes from "./routes/staffRoutes";
import salaryRoutes from "./routes/salaryRoutes";
import clientRoutes from "./routes/clientRoutes";
import orderRoutes from "./routes/orderRoutes";
import treasuryRoutes from "./routes/treasuryRoutes";
import accountLedgerRoutes from "./routes/accountLedgerRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import financeOverviewRoutes from "./routes/financeOverviewRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import rbacRoutes from "./routes/rbacRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import { globalErrorHandler, notFoundHandler } from "./errors";

const app: Application = express();

// --- Core Middlewares ---
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.json());

// --- Vercel Serverless URL Normalizer ---
app.use((req, res, next) => {
  try {
    const rawUrl = req.url || "/";
    const parsedUrl = new URL(rawUrl, "http://localhost");
    const targetUrl = parsedUrl.searchParams.get("__url");

    if (targetUrl) {
      parsedUrl.searchParams.delete("__url");
      const remainingQs = parsedUrl.searchParams.toString();
      req.url = remainingQs ? `${targetUrl}?${remainingQs}` : targetUrl;
    } else if (req.headers["x-matched-path"] && !req.headers["x-matched-path"].toString().includes("index.ts")) {
      req.url = req.headers["x-matched-path"] as string;
    } else if (req.headers["x-forwarded-uri"]) {
      req.url = req.headers["x-forwarded-uri"] as string;
    } else if (req.url.startsWith("/api/index.ts")) {
      req.url = req.url.replace(/^\/api\/index\.ts/, "") || "/";
    } else if (req.url.startsWith("/index.ts")) {
      req.url = req.url.replace(/^\/index\.ts/, "") || "/";
    }
  } catch (err) {
    console.error("URL Normalizer Error:", err);
  }

  next();
});

// --- Register API Modules ---
app.use("/api/clients", clientRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/treasury", treasuryRoutes);
app.use("/api/account-ledger", accountLedgerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/finance-overview", financeOverviewRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expense-vouchers", paymentRoutes);

// Auth & RBAC routes mounted across all potential route paths
app.use("/api/rbac", rbacRoutes);
app.use("/api/auth", rbacRoutes);
app.use("/api", rbacRoutes);   // Handles /api/login
app.use("/", rbacRoutes);      // Handles /login directly if proxy rewrites strip /api

// Dedicated Health Check Endpoint (Both with and without /api prefix)
app.get(["/api/health", "/health"], (req: Request, res: Response) => {
  res.status(200).json({
    status: "online",
    service: "AK Pharma Backend API",
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("AK Pharma TypeScript Backend Server with Supabase is running!");
});

// Handle 404 (Not Found) routes
app.use(notFoundHandler);

// Global Error Handler (intercepts all errors)
app.use(globalErrorHandler);

export default app;
export { app };
