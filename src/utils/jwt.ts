import jwt,{ JwtPayload, SignOptions } from "jsonwebtoken"


const createToken = (payload:JwtPayload,secret:string,expiresIn:SignOptions)=>{
    const token = jwt.sign(payload,secret,expiresIn)
    return token;
}

const verifyToken = (token:string,secret:string)=>{
    try {
        const verifiedToken = jwt.verify(token,secret)
    return verifiedToken;
    } catch (error) {
        throw new Error("Something went wrong gorib")
    }
}

export const jwtUtils={
    createToken,
    verifyToken
}