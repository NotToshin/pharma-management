import { Router } from "express";
import {
  getAllPurchaseOrders,
  getProcurementMetrics,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updateOrderStatus,
  approvePurchaseOrder,
  receiveStock,
  deletePurchaseOrder,
  getAllWholesalers,
  getWholesalerById,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
} from "../controllers/purchaseOrderController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  approvePurchaseOrderSchema,
  receiveStockSchema,
  purchaseOrderIdParamSchema,
  queryPurchaseOrderSchema,
  createWholesalerSchema,
  updateWholesalerSchema,
  wholesalerIdParamSchema,
} from "../validations/purchaseOrderValidation";

const router = Router();

// Metrics
router.get("/metrics", getProcurementMetrics);

// Wholesalers registry convenience routes under procurement
router.get("/wholesalers", getAllWholesalers);
router.get("/wholesalers/:id", validateParams(wholesalerIdParamSchema), getWholesalerById);
router.post("/wholesalers", validateBody(createWholesalerSchema), createWholesaler);
router.put("/wholesalers/:id", validateParams(wholesalerIdParamSchema), validateBody(updateWholesalerSchema), updateWholesaler);
router.delete("/wholesalers/:id", validateParams(wholesalerIdParamSchema), deleteWholesaler);

// Purchase Orders CRUD
router.get("/", validateQuery(queryPurchaseOrderSchema), getAllPurchaseOrders);
router.get("/:id", validateParams(purchaseOrderIdParamSchema), getPurchaseOrderById);
router.post("/", validateBody(createPurchaseOrderSchema), createPurchaseOrder);
router.put("/:id", validateParams(purchaseOrderIdParamSchema), validateBody(updatePurchaseOrderSchema), updatePurchaseOrder);
router.patch("/:id/status", validateParams(purchaseOrderIdParamSchema), validateBody(updatePurchaseOrderStatusSchema), updateOrderStatus);
router.patch("/:id/approve", validateParams(purchaseOrderIdParamSchema), validateBody(approvePurchaseOrderSchema), approvePurchaseOrder);
router.post("/:id/receive", validateParams(purchaseOrderIdParamSchema), validateBody(receiveStockSchema), receiveStock);
router.patch("/:id/receive", validateParams(purchaseOrderIdParamSchema), validateBody(receiveStockSchema), receiveStock);
router.delete("/:id", validateParams(purchaseOrderIdParamSchema), deletePurchaseOrder);

export default router;
