import bcrypt from "bcryptjs";
import { SignOptions } from "jsonwebtoken";
import { TokenPayload } from "google-auth-library";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";
import { googleClient } from "../../lib/googleAuth";
import { AuthProvider } from "../../../generated/prisma/enums";
import { categoryService } from "../category/category.service";
import { quickAddService } from "../quick-add/quick-add.service";
import { IGoogleLoginPayload, ILoginUser, IRegisterUser } from "./auth.types";

const issueTokens = (user: { id: string; name: string | null; email: string }) => {
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return { accessToken, refreshToken };
};

const registerUser = async (payload: IRegisterUser) => {
  const { name, email, password } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new Error("User already exist with this email");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      auth_provider: AuthProvider.CREDENTIAL,
    },
  });

  await categoryService.seedDefaults(user.id);
  await quickAddService.seedDefaults(user.id);

  const { password: _, ...safeUser } = user;

  return { user: safeUser, ...issueTokens(user) };
};

const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  if (user.auth_provider !== AuthProvider.CREDENTIAL || !user.password) {
    throw new Error("Invalid email or password.");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new Error("Password not mathced gorib");
  }

  const { password: _, ...safeUser } = user;

  return { user: safeUser, ...issueTokens(user) };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  if (!config.google_client_id) {
    throw new Error("Google sign-in is not configured on the server.");
  }

  let googleIdTokenPayload: TokenPayload | null | undefined = null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });
    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("Google id token verification failed", error);
    throw new Error("Google sign-in failed. Check that client IDs match on frontend and backend.");
  }

  if (!googleIdTokenPayload?.email) {
    throw new Error("Google id token verififation failed");
  }

  let user = await prisma.user.findUnique({
    where: { google_id: googleIdTokenPayload.sub },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: googleIdTokenPayload.email },
    });
  }

  if (user && user.auth_provider === AuthProvider.CREDENTIAL) {
    throw new Error("An account already exists with this email.");
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: googleIdTokenPayload.email,
        google_id: googleIdTokenPayload.sub,
        auth_provider: AuthProvider.GOOGLE,
        name: googleIdTokenPayload.name,
      },
    });

    await categoryService.seedDefaults(user.id);
  await quickAddService.seedDefaults(user.id);
  }

  const { password: _, ...safeUser } = user;

  return { user: safeUser, ...issueTokens(user) };
};

const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required.");
  }

  const verified = jwtUtils.verifyToken(
    refreshToken,
    config.jwt_refresh_secret,
  ) as { id: string };

  const user = await prisma.user.findUnique({
    where: { id: verified.id },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const { password: _, ...safeUser } = user;

  return { user: safeUser, ...issueTokens(user) };
};

export const authService = {
  registerUser,
  loginUser,
  googleLogin,
  refreshAccessToken,
};
