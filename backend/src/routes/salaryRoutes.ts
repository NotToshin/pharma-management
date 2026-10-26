import { Router } from "express";
import {
  getSalariesByMonth,
  upsertSalary,
  updateSalary,
  deleteSalary,
  generatePayrollForMonth,
} from "../controllers/salaryController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  upsertSalarySchema,
  updateSalarySchema,
  salaryIdParamSchema,
  getSalariesQuerySchema,
  generatePayrollSchema,
} from "../validations/salaryValidation";

const router = Router();

router.get("/", validateQuery(getSalariesQuerySchema), getSalariesByMonth);
router.post("/", validateBody(upsertSalarySchema), upsertSalary);
router.post("/generate", validateBody(generatePayrollSchema), generatePayrollForMonth);
router.put("/:id", validateParams(updateSalarySchema), validateBody(updateSalarySchema), updateSalary);
router.delete("/:id", validateParams(salaryIdParamSchema), deleteSalary);

export default router;