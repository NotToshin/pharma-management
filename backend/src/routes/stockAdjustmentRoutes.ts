import { Router } from "express";
import {
  getAllAdjustments,
  getAdjustmentMetrics,
  getAdjustmentById,
  createAdjustment,
  updateAdjustment,
  updateAdjustmentStatus,
  deleteAdjustment,
} from "../controllers/stockAdjustmentController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createStockAdjustmentSchema,
  updateStockAdjustmentSchema,
  updateStockAdjustmentStatusSchema,
  stockAdjustmentIdParamSchema,
  queryStockAdjustmentSchema,
} from "../validations/stockAdjustmentValidation";

const router = Router();

router.get("/metrics", getAdjustmentMetrics);
router.get("/", validateQuery(queryStockAdjustmentSchema), getAllAdjustments);
router.get("/:id", validateParams(stockAdjustmentIdParamSchema), getAdjustmentById);
router.post("/", validateBody(createStockAdjustmentSchema), createAdjustment);
router.put("/:id", validateParams(updateStockAdjustmentSchema), validateBody(updateStockAdjustmentSchema), updateAdjustment);
router.patch("/:id/status", validateParams(updateStockAdjustmentStatusSchema), validateBody(updateStockAdjustmentStatusSchema), updateAdjustmentStatus);
router.delete("/:id", validateParams(stockAdjustmentIdParamSchema), deleteAdjustment);

export default router;
