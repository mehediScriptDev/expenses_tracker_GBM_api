import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { insightsController } from "./insights.controller";

const router = Router();

router.use(authMiddleware);

router.get("/summaries", insightsController.getSummaries);
router.get("/current", insightsController.getCurrentMonth);
router.get("/summaries/:year/:month", insightsController.getSummary);

export const insightsRoutes = router;
