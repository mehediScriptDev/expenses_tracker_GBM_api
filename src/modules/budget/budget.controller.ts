import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { budgetService } from "./budget.service";

const getBudgets = catchasync(async (req: Request, res: Response) => {
  const result = await budgetService.getBudgets(req.user!.id, req.query);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Budgets fetched successfully.",
    data: result.budgets,
    meta: result.meta,
  });
});

const createBudget = catchasync(async (req: Request, res: Response) => {
  const budget = await budgetService.createBudget(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    status: 201,
    message: "Budget created successfully.",
    data: budget,
  });
});

const updateBudget = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const budget = await budgetService.updateBudget(req.user!.id, id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Budget updated successfully.",
    data: budget,
  });
});

const deleteBudget = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await budgetService.deleteBudget(req.user!.id, id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Budget deleted successfully.",
    data: null,
  });
});

export const budgetController = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
