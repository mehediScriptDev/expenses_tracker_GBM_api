import { NextFunction, Request, RequestHandler, Response } from "express";
import { userService } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";

const createUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const user = await userService.registerUserIntoDb(payload);

    sendResponse(res,{
      success: true,
      status: 200,
      message: "User registration successful.",
      data: user,
    });
  } catch (error) {
    sendResponse(res, {
      success: false,
      status: 400,
      message: "User registration failed.",
      data: null,
    });
  }
};

export const userController = {
  createUser,
};
