import { Router } from "express";
import {
  getAllVouchers,
  getNextVoucherNumber,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "../controllers/paymentController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createVoucherSchema,
  updateVoucherSchema,
  voucherIdParamSchema,
} from "../validations/paymentValidation";

const router = Router();

router.get("/next-number", getNextVoucherNumber);
router.get("/", getAllVouchers);
router.post("/", validateBody(createVoucherSchema), createVoucher);
router.put("/:id", validateParams(updateVoucherSchema), validateBody(updateVoucherSchema), updateVoucher);
router.delete("/:id", validateParams(voucherIdParamSchema), deleteVoucher);

export default router;