import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { dashboardService } from "./dashboard.service";

const getDashboard = catchasync(async (req: Request, res: Response) => {
  const dashboard = await dashboardService.getDashboard(req.user!.id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Dashboard fetched successfully.",
    data: dashboard,
  });
});

export const dashboardController = {
  getDashboard,
};
