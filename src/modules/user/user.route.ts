import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { userController } from "./user.controller";

const router = Router();

router.get("/profile", authMiddleware, userController.getProfile);
router.patch("/profile", authMiddleware, userController.updateProfile);
router.patch("/password", authMiddleware, userController.changePassword);

export const userRoutes = router;
