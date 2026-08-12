import { NextFunction, Request, RequestHandler, Response } from "express";

export const catchasync = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";

      res.status(400).json({
        success: false,
        status: 400,
        message,
        data: null,
      });
    }
  };
};
