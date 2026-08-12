import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { budgetController } from "./budget.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", budgetController.getBudgets);
router.post("/", budgetController.createBudget);
router.patch("/:id", budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

export const budgetRoutes = router;
