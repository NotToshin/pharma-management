import { Router } from "express";
import {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController";

const router = Router();

router.get("/", getAllOrders);
router.post("/", createOrder);
router.put("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;