import { Router } from "express";
import {
  getAllVouchers,
  getVoucherMetrics,
  getNextVoucherNumber,
  getVoucherById,
  createVoucher,
  updateVoucher,
  authorizeVoucher,
  deleteVoucher,
} from "../controllers/paymentController";
import { validate, validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createVoucherSchema,
  updateVoucherSchema,
  authorizeVoucherSchema,
  voucherIdParamSchema,
  queryVoucherSchema,
} from "../validations/paymentValidation";

const router = Router();

router.get("/metrics", getVoucherMetrics);
router.get("/next-number", getNextVoucherNumber);
router.get("/", validateQuery(queryVoucherSchema), getAllVouchers);
router.get("/:id", validateParams(voucherIdParamSchema), getVoucherById);
router.post("/", validateBody(createVoucherSchema), createVoucher);
router.put("/:id", validate(updateVoucherSchema), updateVoucher);
router.post("/:id/authorize", validate(authorizeVoucherSchema), authorizeVoucher);
router.delete("/:id", validateParams(voucherIdParamSchema), deleteVoucher);

export default router;