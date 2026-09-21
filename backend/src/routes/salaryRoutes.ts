import { Router } from "express";
import { getSalariesByMonth, upsertSalary, updateSalary, deleteSalary } from "../controllers/salaryController";

const router = Router();

router.get("/", getSalariesByMonth);
router.post("/", upsertSalary);
router.put("/:id", updateSalary);
router.delete("/:id", deleteSalary);

export default router; // <--- This fixes the "is not a module" error