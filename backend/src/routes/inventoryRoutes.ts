import { Router } from "express";
import {
  getAllBatches,
  createBatch,
  updateBatch,
  adjustStock,
  deleteBatch,
} from "../controllers/inventoryController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createInventoryBatchSchema,
  updateInventoryBatchSchema,
  adjustStockSchema,
  batchIdParamSchema,
} from "../validations/inventoryValidation";

const router = Router();

router.get("/", getAllBatches);
router.post("/", validateBody(createInventoryBatchSchema), createBatch);
router.put("/:id", validateParams(updateInventoryBatchSchema), validateBody(updateInventoryBatchSchema), updateBatch);
router.post("/:id/adjust", validateParams(adjustStockSchema), validateBody(adjustStockSchema), adjustStock);
router.delete("/:id", validateParams(batchIdParamSchema), deleteBatch);

export default router;