import { Router } from "express";
import {
  getAllAllocations,
  getStaffMios,
  createAllocation,
  updateAllocation,
  deleteAllocation,
} from "../controllers/zoneAllocationController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createZoneAllocationSchema,
  updateZoneAllocationSchema,
  zoneAllocationIdParamSchema,
  getZoneAllocationsQuerySchema,
} from "../validations/zoneAllocationValidation";

const router = Router();

router.get("/", validateQuery(getZoneAllocationsQuerySchema), getAllAllocations);
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
