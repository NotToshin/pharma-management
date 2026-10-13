import { Router } from "express";
import {
  getAllAllocations,
  getStaffMios,
  createAllocation,
  updateAllocation,
  deleteAllocation,
} from "../controllers/zoneAllocationController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createZoneAllocationSchema,
  updateZoneAllocationSchema,
  zoneAllocationIdParamSchema,
} from "../validations/zoneAllocationValidation";

const router = Router();

router.get("/", getAllAllocations);
router.get("/staff-mios", getStaffMios);
router.post("/", validateBody(createZoneAllocationSchema), createAllocation);
router.put(
  "/:id",
  validateParams(updateZoneAllocationSchema),
  validateBody(updateZoneAllocationSchema),
  updateAllocation
);
router.delete(
  "/:id",
  validateParams(zoneAllocationIdParamSchema),
  deleteAllocation
);

export default router;
