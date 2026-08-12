import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/google", authController.googleLogin);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/logout", authController.logoutUser);

export const authRoutes = router;
