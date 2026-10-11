import { Router } from "express";
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  bulkImportDoctors,
} from "../controllers/doctorController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createDoctorSchema,
  updateDoctorSchema,
  doctorIdParamSchema,
  bulkImportDoctorSchema,
} from "../validations/doctorValidation";

const router = Router();

router.get("/", getAllDoctors);
router.post("/bulk-import", validateBody(bulkImportDoctorSchema), bulkImportDoctors);
router.get("/:id", validateParams(doctorIdParamSchema), getDoctorById);
router.post("/", validateBody(createDoctorSchema), createDoctor);
router.put("/:id", validateParams(doctorIdParamSchema), validateBody(updateDoctorSchema), updateDoctor);
router.delete("/:id", validateParams(doctorIdParamSchema), deleteDoctor);

export default router;