import { NextFunction, Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { authService } from "./auth.services";
import { sendResponse } from "../../utils/sendResponse";

const loginUser = catchasync(async(req:Request,res: Response,next:NextFunction)=>{
const payload= req.body;
const loginResult = await authService.loginUser(payload);

sendResponse(res,{
    success:true,
    status:200,
    message:"User login successful.",
    data:loginResult
})
})

export const authController = {
    loginUser
}