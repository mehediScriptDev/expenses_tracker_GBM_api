import { NextFunction, Request, RequestHandler, Response } from "express";
import { userService } from "./user.service";



const createUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const user = await userService.registerUserIntoDb(payload);

    res.status(201).json({
      success: true,
      status: 201,
      message: "User registration completed.",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
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
