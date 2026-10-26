import { Router } from "express";
import { getAllRoles, createRole, deleteRole } from "../controllers/roleController";

const router = Router();

router.get("/", getAllRoles);
router.post("/", createRole);
router.delete("/:id", deleteRole);

export default router;
