import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { transactionController } from "./transaction.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", transactionController.getTransactions);
router.post("/", transactionController.createTransaction);
router.patch("/:id", transactionController.updateTransaction);
router.delete("/:id", transactionController.deleteTransaction);
router.post("/:id/duplicate", transactionController.duplicateTransaction);

export const transactionRoutes = router;
