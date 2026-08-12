import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { quickAddController } from "./quick-add.controller";

const router = Router();

router.use(authMiddleware);

router.post("/seed-defaults", quickAddController.seedDefaults);
router.get("/", quickAddController.getQuickAdds);
router.post("/", quickAddController.createQuickAdd);
router.patch("/:id", quickAddController.updateQuickAdd);
router.delete("/:id", quickAddController.deleteQuickAdd);

export const quickAddRoutes = router;
