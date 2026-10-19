import { Router } from "express";
import {
  getAllBatches,
  getInventoryStats,
  getBatchById,
  createBatch,
  updateBatch,
  adjustStock,
  quarantineBatch,
  deleteBatch,
} from "../controllers/inventoryController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createInventoryBatchSchema,
  updateInventoryBatchSchema,
  adjustStockSchema,
  quarantineBatchSchema,
  batchIdParamSchema,
} from "../validations/inventoryValidation";

const router = Router();

router.get("/", getAllBatches);
router.get("/stats", getInventoryStats);
router.get("/:id", validateParams(batchIdParamSchema), getBatchById);

router.post("/", validateBody(createInventoryBatchSchema), createBatch);
router.put(
  "/:id",
  validateParams(updateInventoryBatchSchema),
  validateBody(updateInventoryBatchSchema),
  updateBatch
);
router.post(
  "/:id/adjust",
  validateParams(adjustStockSchema),
  validateBody(adjustStockSchema),
  adjustStock
);
router.post(
  "/:id/quarantine",
  validateParams(quarantineBatchSchema),
  validateBody(quarantineBatchSchema),
  quarantineBatch
);
router.delete("/:id", validateParams(batchIdParamSchema), deleteBatch);

export default router;