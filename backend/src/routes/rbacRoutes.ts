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

const router = Router();

// Authentication
router.post("/login", loginOperator);

// Roles & Permissions Matrix
router.get("/roles", getRoles);
router.put("/roles/:id/permissions", updateRolePermissions);

// User Provisioning
router.get("/users", getUsers);
router.post("/users", provisionUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/status", toggleUserStatus);

export default router;