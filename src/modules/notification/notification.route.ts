import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { notificationController } from "./notification.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", notificationController.getNotifications);
router.post("/read", notificationController.markRead);
router.delete("/read", notificationController.clearReadState);

export const notificationRoutes = router;
