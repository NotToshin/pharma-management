import { Router } from "express";
import {
  getAllWholesalers,
  getWholesalerById,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
} from "../controllers/purchaseOrderController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createWholesalerSchema,
  updateWholesalerSchema,
  wholesalerIdParamSchema,
} from "../validations/purchaseOrderValidation";

const router = Router();

router.get("/", getAllWholesalers);
router.get("/:id", validateParams(wholesalerIdParamSchema), getWholesalerById);
router.post("/", validateBody(createWholesalerSchema), createWholesaler);
router.put("/:id", validateParams(wholesalerIdParamSchema), validateBody(updateWholesalerSchema), updateWholesaler);
router.delete("/:id", validateParams(wholesalerIdParamSchema), deleteWholesaler);

export default router;
