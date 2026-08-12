import { NextFunction, Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { authService } from "./auth.services";
import { sendResponse } from "../../utils/sendResponse";

const sendAuthResponse = (
  res: Response,
  message: string,
  status: number,
  accessToken: string,
  refreshToken: string,
  user?: unknown,
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    success: true,
    status,
    message,
    data: { user, accessToken, refreshToken },
  });
};

const registerUser = catchasync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  sendAuthResponse(res, "User registration successful.", 201, accessToken, refreshToken, user);
});

const loginUser = catchasync(async (req: Request, res: Response, next: NextFunction) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
  sendAuthResponse(res, "User login successful.", 200, accessToken, refreshToken, user);
});

const googleLogin = catchasync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.googleLogin(req.body);
  sendAuthResponse(res, "Google auth successful.", 200, accessToken, refreshToken, user);
});

const refreshAccessToken = catchasync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
  const { user, accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAccessToken(refreshToken);
  sendAuthResponse(res, "Access token refreshed successfully.", 200, accessToken, newRefreshToken, user);
});

const logoutUser = catchasync(async (_req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Logged out successfully.",
    data: null,
  });
});

export const authController = {
  registerUser,
  loginUser,
  googleLogin,
  refreshAccessToken,
  logoutUser,
};
