import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { categoryController } from "./category.controller";

const router = Router();

router.use(authMiddleware);

router.post("/seed-defaults", categoryController.seedDefaults);
router.get("/", categoryController.getCategories);
router.post("/", categoryController.createCategory);
router.patch("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

export const categoryRoutes = router;
