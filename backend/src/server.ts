import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.options("*", cors());
app.use(express.json());

// Register API Modules
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
app.use("/api/rbac", rbacRoutes);
app.use("/api/auth", rbacRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expense-vouchers", paymentRoutes);

// Dedicated Health Check Endpoint
app.get("/api/health", (req: Request, res: Response) => {
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

// Only listen when running standalone in local development
if (process.env.NODE_ENV !== "production") {
  app.listen(Number(PORT), () => {
    console.log(`🚀 AK Pharma Backend running on port ${PORT}`);
  });
}

// Export app for Vercel Serverless Functions
export default app;
