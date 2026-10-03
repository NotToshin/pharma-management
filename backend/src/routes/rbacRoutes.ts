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
  roleIdParamSchema,
} from "../validations/rbacValidation";

const router = Router();

// Authentication
router.post("/login", validateBody(loginOperatorSchema), loginOperator);

// Roles & Permissions Matrix
router.get("/roles", getRoles);
router.put("/roles/:id/permissions", validateParams(updateRolePermissionsSchema), validateBody(updateRolePermissionsSchema), updateRolePermissions);

// User Provisioning
router.get("/users", getUsers);
router.post("/users", validateBody(provisionUserSchema), provisionUser);
router.delete("/users/:id", validateParams(userIdParamSchema), deleteUser);
router.put("/users/:id/status", validateParams(userIdParamSchema), toggleUserStatus);

export default router;