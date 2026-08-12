import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { insightsService } from "./insights.service";

const getSummaries = catchasync(async (req: Request, res: Response) => {
  const summaries = await insightsService.getSummaries(req.user!.id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Monthly summaries fetched successfully.",
    data: summaries,
  });
});

const getCurrentMonth = catchasync(async (req: Request, res: Response) => {
  const summary = await insightsService.getCurrentMonth(req.user!.id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Current month summary fetched successfully.",
    data: summary,
  });
});

const getSummary = catchasync(async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  const summary = await insightsService.getSummary(req.user!.id, year, month);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Monthly summary fetched successfully.",
    data: summary,
  });
});

export const insightsController = {
  getSummaries,
  getCurrentMonth,
  getSummary,
};
