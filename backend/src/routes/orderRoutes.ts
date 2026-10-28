import { Router } from "express";
import {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  updateOrderInvoice,
} from "../controllers/orderController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParamSchema,
  updateOrderInvoiceSchema,
} from "../validations/orderValidation";

const router = Router();

router.get("/", getAllOrders);
router.post("/", validateBody(createOrderSchema), createOrder);
router.patch("/:id/invoice", validateParams(updateOrderInvoiceSchema), validateBody(updateOrderInvoiceSchema), updateOrderInvoice);
router.put("/:id", validateParams(updateOrderStatusSchema), validateBody(updateOrderStatusSchema), updateOrderStatus);
router.delete("/:id", validateParams(orderIdParamSchema), deleteOrder);

export default router;
