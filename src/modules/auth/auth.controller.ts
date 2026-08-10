import { NextFunction, Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { authService } from "./auth.services";
import { sendResponse } from "../../utils/sendResponse";

const loginUser = catchasync(async(req:Request,res: Response,next:NextFunction)=>{
const payload= req.body;
const {refreshToken,accessToken} = await authService.loginUser(payload);

res.cookie("accessToken",accessToken,{
   httpOnly:true,
    secure:false,
    sameSite:"none",
    maxAge: 1000*60*60*24*7
})
res.cookie("refreshToken",refreshToken,{
    httpOnly:true,
    secure:false,
    sameSite:"none",
    maxAge: 1000*60*60*24*7
})

sendResponse(res,{
    success:true,
    status:200,
    message:"User login successful.",
    data:{accessToken,refreshToken}
})
})

const googleLogin = catchasync(async(req:Request,res:Response)=>{

    const payload = req.body;
    const result = await authService.googleLogin(payload);

    sendResponse(res,{
        status:200,
        success:true,
        message:"Google login successful",
        data:{}
    })
})

export const authController = {
    loginUser,
    googleLogin
}