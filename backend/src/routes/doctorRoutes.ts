import { Router } from "express";
import {
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createDoctorSchema,
  updateDoctorSchema,
  doctorIdParamSchema,
} from "../validations/doctorValidation";

const router = Router();

router.get("/", getAllDoctors);
router.post("/", validateBody(createDoctorSchema), createDoctor);
router.put("/:id", validateParams(updateDoctorSchema), validateBody(updateDoctorSchema), updateDoctor);
router.delete("/:id", validateParams(doctorIdParamSchema), deleteDoctor);

export default router;