import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
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

import { actorContextMiddleware } from "./middlewares/actorContextMiddleware";

const app: Application = express();

// --- Core Middlewares ---
app.use(
  cors({
    origin: (origin, callback) => callback(null, origin || true),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-user-email",
      "x-user-name",
      "x-user-role",
    ],
    credentials: true,
  })
);
app.options("*", cors({ origin: (origin, callback) => callback(null, origin || true), credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(actorContextMiddleware);

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
// Authentication & Token Lifecycle
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

// RBAC Permissions & Roles Matrix
app.use("/api/rbac", rbacRoutes);

import doctorVisitLogRoutes from "./routes/doctorVisitLogRoutes";

import roleRoutes from "./routes/roleRoutes";

import zoneAllocationRoutes from "./routes/zoneAllocationRoutes";

import stockAdjustmentRoutes from "./routes/stockAdjustmentRoutes";

import auditLogRoutes from "./routes/auditLogRoutes";
import territoryTargetRoutes from "./routes/territoryTargetRoutes";
import territoryAnalyticsRoutes from "./routes/territoryAnalyticsRoutes";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes";
import wholesalerRoutes from "./routes/wholesalerRoutes";

// Core Modules
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/zone-allocations", zoneAllocationRoutes);
app.use("/api/targets", territoryTargetRoutes);
app.use("/api/territory-targets", territoryTargetRoutes);
app.use("/api/territory-analytics", territoryAnalyticsRoutes);
app.use("/api/analytics/territories", territoryAnalyticsRoutes);
app.use("/api/stock-adjustments", stockAdjustmentRoutes);
app.use("/api/procurement/orders", purchaseOrderRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/wholesalers", wholesalerRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/treasury", treasuryRoutes);
app.use("/api/account-ledger", accountLedgerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/finance-overview", financeOverviewRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/visit-logs", doctorVisitLogRoutes);
app.use("/api/doctor-visit-logs", doctorVisitLogRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expense-vouchers", paymentRoutes);

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
  res.send("AK Pharma Backend Server is running!");
});

// Handle 404 (Not Found) routes
app.use(notFoundHandler);

// Global Error Handler (intercepts all errors)
app.use(globalErrorHandler);

export default app;
export { app };
