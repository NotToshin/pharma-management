import { Router } from "express";
import {
  getAllTerritories,
  createTerritory,
} from "../controllers/territoryController";

const router = Router();

router.get("/", getAllTerritories);
router.post("/", createTerritory);

export default router;
