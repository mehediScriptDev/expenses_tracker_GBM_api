import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { loanController } from "./loan.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", loanController.getLoans);
router.post("/", loanController.createLoan);
router.patch("/:id", loanController.updateLoan);
router.post("/:id/repay", loanController.repayLoan);
router.delete("/:id", loanController.deleteLoan);

export const loanRoutes = router;
