import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { userService } from "./user.service";

const getProfile = catchasync(async (req: Request, res: Response) => {
  const user = await userService.getProfile(req.user!.id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Profile fetched successfully.",
    data: user,
  });
});

const updateProfile = catchasync(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Profile updated successfully.",
    data: user,
  });
});

const changePassword = catchasync(async (req: Request, res: Response) => {
  await userService.changePassword(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Password updated successfully.",
    data: null,
  });
});

export const userController = {
  getProfile,
  updateProfile,
  changePassword,
};
