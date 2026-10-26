import { Router } from "express";
import { getAllStaff, createStaff, updateStaff, deleteStaff } from "../controllers/staffController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createStaffSchema,
  updateStaffSchema,
  staffIdParamSchema,
} from "../validations/staffValidation";

const router = Router();

router.get("/", getAllStaff);
router.post("/", validateBody(createStaffSchema), createStaff);
router.put("/:id", validateParams(updateStaffSchema), validateBody(updateStaffSchema), updateStaff);
router.delete("/:id", validateParams(staffIdParamSchema), deleteStaff);

export default router;