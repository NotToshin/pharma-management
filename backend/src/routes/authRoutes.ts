import { Router } from "express";
import { login, refreshToken, logout } from "../controllers/authController";
import { validateBody } from "../utils/validate";
import { loginSchema } from "../validations/authValidation";

const router = Router();

router.post("/login", validateBody(loginSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;
