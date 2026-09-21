import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import doctorRoutes from "./routes/doctorRoutes";
import staffRoutes from "./routes/staffRoutes";
import salaryRoutes from "./routes/salaryRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Register API Modules
app.use("/api/doctors", doctorRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/salary", salaryRoutes); // <--- Registered correctly here

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.send("AK Pharma TypeScript Backend Server with Supabase is running!");
});

app.listen(Number(PORT), () => {
  console.log(`🚀 AK Pharma Backend running on http://localhost:${PORT}`);
});