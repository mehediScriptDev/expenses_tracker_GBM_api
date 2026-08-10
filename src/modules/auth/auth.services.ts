import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { IGoogleLoginPayload, ILoginUser } from "./auth.types"
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import { AuthProvider } from "../../../generated/prisma/enums";

const loginUser= async (payload: ILoginUser)=>{
    const {email,password}= payload;

    const user = await prisma.user.findUniqueOrThrow({
        where:{
            email
        }
    })
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if(!isPasswordMatched){
        throw new Error("Password not mathced gorib");
    }

    const jwtPayload= {
        id: user.id,
        name: user.name,
        email: user.email
    }

    const accessToken = jwtUtils.createToken(jwtPayload,config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    )

    const refreshToken = jwtUtils.createToken(jwtPayload,config.jwt_refresh_secret,config.jwt_refresh_expires_in as SignOptions)

    return { user, accessToken, refreshToken };

}

const googleLogin = async(payload:IGoogleLoginPayload)=>{
    let googleIdTokenPayload: TokenPayload | null | undefined = null;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken:payload.idToken,
            audience:config.google_client_id
        })
        googleIdTokenPayload = ticket.getPayload()
    } catch (error) {
        console.log("Google id token verififation failed", error);
        throw new Error("Invalid or something wrong")
        
    }
    if(!googleIdTokenPayload){
        throw new Error("Google id token verififation failed")
    }
    if(!googleIdTokenPayload.email){
        throw new Error("Google id token verififation failed")
    }
    const ifUserExistWithGoogleId = await prisma.user.findUnique({
        where:{
            email:googleIdTokenPayload.email,
            google_id:googleIdTokenPayload.sub
        }
    })

    let user = ifUserExistWithGoogleId;
    if(!user){
       user = await prisma.user.create({
            data:{
                email:googleIdTokenPayload.email,
                google_id:googleIdTokenPayload.sub,
                auth_provider:AuthProvider.GOOGLE,
                password:"marmutoregorib",
                name:googleIdTokenPayload.name

                
            }
        })
    }
   const jwtPayload= {
    id: user?.id,
    name: user?.name,
    email: user?.email
   }
   const accessToken = jwtUtils.createToken(jwtPayload,config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    )
    
    const refreshToken = jwtUtils.createToken(jwtPayload,config.jwt_refresh_secret,config.jwt_refresh_expires_in as SignOptions)

    return { user, accessToken, refreshToken };
}

export const authService = {
    loginUser,
    googleLogin
}