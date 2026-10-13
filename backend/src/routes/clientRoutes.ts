import { Router } from "express";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  bulkImportClients,
} from "../controllers/clientController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createClientSchema,
  updateClientSchema,
  clientIdParamSchema,
  bulkImportClientSchema,
  getClientsQuerySchema,
} from "../validations/clientValidation";

const router = Router();

router.get("/", validateQuery(getClientsQuerySchema), getAllClients);
router.post("/bulk-import", validateBody(bulkImportClientSchema), bulkImportClients);
router.get("/:id", validateParams(clientIdParamSchema), getClientById);
router.post("/", validateBody(createClientSchema), createClient);
router.put("/:id", validateParams(clientIdParamSchema), validateBody(updateClientSchema), updateClient);
router.delete("/:id", validateParams(clientIdParamSchema), deleteClient);

export default router;