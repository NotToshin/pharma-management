import { Router } from "express";
import {
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController";

const router = Router();

router.get("/", getAllDoctors);
router.post("/", createDoctor);
router.put("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

export default router;