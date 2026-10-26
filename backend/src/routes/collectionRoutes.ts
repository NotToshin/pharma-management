import { Router } from "express";
import {
  getAllCollections,
  getCollectionMetrics,
  getNextReceiptNumber,
  getCollectionById,
  createCollection,
  updateCollection,
  settleCollections,
  deleteCollection,
} from "../controllers/collectionController";
import { validate, validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createCollectionSchema,
  updateCollectionSchema,
  settleBulkCollectionSchema,
  collectionIdParamSchema,
  queryCollectionSchema,
} from "../validations/collectionValidation";

const router = Router();

router.get("/metrics", getCollectionMetrics);
router.get("/next-number", getNextReceiptNumber);
router.get("/", validateQuery(queryCollectionSchema), getAllCollections);
router.get("/:id", validateParams(collectionIdParamSchema), getCollectionById);
router.post("/", validateBody(createCollectionSchema), createCollection);
router.put("/:id", validate(updateCollectionSchema), updateCollection);
router.post("/settle", validateBody(settleBulkCollectionSchema), settleCollections);
router.delete("/:id", validateParams(collectionIdParamSchema), deleteCollection);

export default router;
