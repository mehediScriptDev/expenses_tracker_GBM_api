import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/login",authController.loginUser)
router.post("/google",authController.googleLogin)

export const authRoutes = router;