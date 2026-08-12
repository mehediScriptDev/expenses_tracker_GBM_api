import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", dashboardController.getDashboard);

export const dashboardRoutes = router;
