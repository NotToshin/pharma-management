import { Router } from "express";
import {
  getOpenBills,
  getSettlements,
  createSettlement,
  reverseSettlement,
  deleteSettlement,
} from "../controllers/settlementController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createSettlementSchema,
  querySettlementSchema,
  openBillsQuerySchema,
  settlementIdParamSchema,
} from "../validations/settlementValidation";

const router = Router();

router.get("/open-bills", validateQuery(openBillsQuerySchema), getOpenBills);
router.get("/", validateQuery(querySettlementSchema), getSettlements);
router.post("/", validateBody(createSettlementSchema), createSettlement);
router.post("/:id/reverse", validateParams(settlementIdParamSchema), reverseSettlement);
router.delete("/:id", validateParams(settlementIdParamSchema), deleteSettlement);

export default router;
