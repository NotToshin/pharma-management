import { Router } from "express";
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clientController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createClientSchema,
  updateClientSchema,
  clientIdParamSchema,
} from "../validations/clientValidation";

const router = Router();

router.get("/", getAllClients);
router.post("/", validateBody(createClientSchema), createClient);
router.put("/:id", validateParams(updateClientSchema), validateBody(updateClientSchema), updateClient);
router.delete("/:id", validateParams(clientIdParamSchema), deleteClient);

export default router;