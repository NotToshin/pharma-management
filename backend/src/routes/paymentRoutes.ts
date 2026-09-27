import { Router } from "express";
import {
  getAllVouchers,
  getNextVoucherNumber,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "../controllers/paymentController";

const router = Router();

router.get("/next-number", getNextVoucherNumber);
router.get("/", getAllVouchers);
router.post("/", createVoucher);
router.put("/:id", updateVoucher);
router.delete("/:id", deleteVoucher);

export default router;