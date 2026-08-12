import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { goalController } from "./goal.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", goalController.getGoals);
router.post("/", goalController.createGoal);
router.patch("/:id", goalController.updateGoal);
router.post("/:id/deposit", goalController.depositGoal);
router.delete("/:id", goalController.deleteGoal);

export const goalRoutes = router;
