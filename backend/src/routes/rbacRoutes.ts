import { Router } from "express";
import {
  getRoles,
  createRole,
  updateRolePermissions,
  getUsers,
  provisionUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  loginOperator,
} from "../controllers/rbacController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  loginOperatorSchema,
  provisionUserSchema,
  createRoleSchema,
  updateRolePermissionsSchema,
  updateUserSchema,
  userIdParamSchema,
  getUsersQuerySchema,
} from "../validations/rbacValidation";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// Authentication
router.post("/login", validateBody(loginOperatorSchema), loginOperator);

// Roles & Permissions Matrix (Protected - Super Admin Only)
router.get("/roles", requireAuth("SUPER_ADMIN"), getRoles);
router.post(
  "/roles",
  requireAuth("SUPER_ADMIN"),
  validateBody(createRoleSchema),
  createRole
);
router.put(
  "/roles/:id/permissions",
  requireAuth("SUPER_ADMIN"),
  validateParams(updateRolePermissionsSchema),
  validateBody(updateRolePermissionsSchema),
  updateRolePermissions
);

// User Provisioning & Delegation (Protected - Super Admin Only)
router.get(
  "/users",
  requireAuth("SUPER_ADMIN"),
  validateQuery(getUsersQuerySchema),
  getUsers
);
router.post(
  "/users",
  requireAuth("SUPER_ADMIN"),
  validateBody(provisionUserSchema),
  provisionUser
);
router.put(
  "/users/:id",
  requireAuth("SUPER_ADMIN"),
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  updateUser
);
router.delete(
  "/users/:id",
  requireAuth("SUPER_ADMIN"),
  validateParams(userIdParamSchema),
  deleteUser
);
router.put(
  "/users/:id/status",
  requireAuth("SUPER_ADMIN"),
  validateParams(userIdParamSchema),
  toggleUserStatus
);

export default router;