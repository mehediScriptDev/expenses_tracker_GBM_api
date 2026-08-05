import { NextFunction, Request, RequestHandler, Response } from "express";
import { userService } from "./user.service";

type TMeta = {
  page: number;
  limit: number;
  total: number;
};

type TResponseData<T>={
    success: boolean;
    status: number;
    message: string;
    data: T;
    meta?: TMeta
}

const sendResonse = <T>(res:Response, data:TResponseData<T>) => {
    res.status(data.status).json({
        success: data.success,
        status: data.status,
        message: data.message,
        data: data.data,
        meta: data.meta
    })
}

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
