import { Router } from "express";
import {
  getAllBatches,
  createBatch,
  updateBatch,
  adjustStock,
  deleteBatch,
} from "../controllers/inventoryController";

const router = Router();

router.get("/", getAllBatches);
router.post("/", createBatch);
router.put("/:id", updateBatch);
router.post("/:id/adjust", adjustStock);
router.delete("/:id", deleteBatch);

export default router;