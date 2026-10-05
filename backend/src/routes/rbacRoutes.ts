import { Router } from "express";
import {
  getRoles,
  updateRolePermissions,
  getUsers,
  provisionUser,
  deleteUser,
  toggleUserStatus,
  loginOperator,
} from "../controllers/rbacController";
import { validateBody, validateParams } from "../utils/validate";
import {
  loginOperatorSchema,
  provisionUserSchema,
  updateRolePermissionsSchema,
  userIdParamSchema,
} from "../validations/rbacValidation";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// Authentication
router.post("/login", validateBody(loginOperatorSchema), loginOperator);

// Roles & Permissions Matrix (Protected)
router.get("/roles", requireAuth(), getRoles);
router.put(
  "/roles/:id/permissions",
  requireAuth("SUPER_ADMIN"),
  validateParams(updateRolePermissionsSchema),
  validateBody(updateRolePermissionsSchema),
  updateRolePermissions
);

// User Provisioning (Protected)
router.get("/users", requireAuth(), getUsers);
router.post("/users", requireAuth("SUPER_ADMIN"), validateBody(provisionUserSchema), provisionUser);
router.delete("/users/:id", requireAuth("SUPER_ADMIN"), validateParams(userIdParamSchema), deleteUser);
router.put("/users/:id/status", requireAuth("SUPER_ADMIN"), validateParams(userIdParamSchema), toggleUserStatus);

export default router;