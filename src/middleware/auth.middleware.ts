import { NextFunction, Request, Response } from "express";
import config from "../config";
import { sendResponse } from "../utils/sendResponse";
import { jwtUtils } from "../utils/jwt";
import { IJwtPayload } from "../modules/auth/auth.types";

const getBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7);
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.accessToken ?? getBearerToken(req);

    if (!token) {
      sendResponse(res, {
        success: false,
        status: 401,
        message: "You are not authorized.",
        data: null,
      });
      return;
    }

    const verified = jwtUtils.verifyToken(
      token,
      config.jwt_access_secret,
    ) as IJwtPayload;

    req.user = {
      id: verified.id,
      name: verified.name ?? null,
      email: verified.email,
    };

    next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "You are not authorized.";

    sendResponse(res, {
      success: false,
      status: 401,
      message,
      data: null,
    });
  }
};
