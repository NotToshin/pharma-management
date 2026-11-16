import { Router } from "express";
import {
  getAllOrders,
  getOrderStats,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  updateOrderInvoice,
  updateOrder,
} from "../controllers/orderController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParamSchema,
  updateOrderInvoiceSchema,
  getOrdersQuerySchema,
  updateOrderSchema,
} from "../validations/orderValidation";
import { requireAuth, requirePermission } from "../middlewares/requireAuth";

const router = Router();

router.get("/", validateQuery(getOrdersQuerySchema), getAllOrders);
router.get("/stats", getOrderStats);
router.post("/", validateBody(createOrderSchema), createOrder);
router.patch("/:id", requireAuth(), requirePermission("Sales Orders", "edit"), validateParams(updateOrderSchema), validateBody(updateOrderSchema), updateOrder);
router.patch("/:id/invoice", validateParams(updateOrderInvoiceSchema), validateBody(updateOrderInvoiceSchema), updateOrderInvoice);
router.put("/:id", validateParams(updateOrderStatusSchema), validateBody(updateOrderStatusSchema), updateOrderStatus);
router.delete("/:id", validateParams(orderIdParamSchema), deleteOrder);

export default router;
