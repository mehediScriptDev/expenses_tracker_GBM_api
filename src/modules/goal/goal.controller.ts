import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { goalService } from "./goal.service";

const getGoals = catchasync(async (req: Request, res: Response) => {
  const goals = await goalService.getGoals(req.user!.id, req.query);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Goals fetched successfully.",
    data: goals,
  });
});

const createGoal = catchasync(async (req: Request, res: Response) => {
  const goal = await goalService.createGoal(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    status: 201,
    message: "Goal created successfully.",
    data: goal,
  });
});

const updateGoal = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const goal = await goalService.updateGoal(req.user!.id, id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Goal updated successfully.",
    data: goal,
  });
});

const depositGoal = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const goal = await goalService.depositGoal(req.user!.id, id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Goal deposit recorded successfully.",
    data: goal,
  });
});

const deleteGoal = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await goalService.deleteGoal(req.user!.id, id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Goal deleted successfully.",
    data: null,
  });
});

export const goalController = {
  getGoals,
  createGoal,
  updateGoal,
  depositGoal,
  deleteGoal,
};
