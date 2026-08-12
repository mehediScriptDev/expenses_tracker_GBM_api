import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { notificationService } from "./notification.service";

const getNotifications = catchasync(async (req: Request, res: Response) => {
  const result = await notificationService.getNotifications(
    req.user!.id,
    req.query,
  );

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Notifications fetched successfully.",
    data: result.notifications,
    meta: result.meta,
  });
});

const markRead = catchasync(async (req: Request, res: Response) => {
  await notificationService.markRead(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Notification marked as read.",
    data: null,
  });
});

const clearReadState = catchasync(async (req: Request, res: Response) => {
  await notificationService.clearReadState(req.user!.id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Notification read state cleared.",
    data: null,
  });
});

export const notificationController = {
  getNotifications,
  markRead,
  clearReadState,
};
