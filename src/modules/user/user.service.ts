import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { AuthProvider } from "../../generated/prisma/enums";
import { IChangePassword, IUpdateProfile } from "./user.types";

const safeUser = <T extends { password?: string | null }>(user: T) => {
  const { password: _, ...rest } = user;
  return rest;
};

const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return safeUser(user);
};

const updateProfile = async (userId: string, payload: IUpdateProfile) => {
  const data: IUpdateProfile = {};

  if (payload.name !== undefined) {
    data.name = payload.name.trim();
  }

  if (payload.monthly_salary !== undefined) {
    data.monthly_salary = Math.max(0, payload.monthly_salary);
  }

  if (payload.salary_day !== undefined) {
    data.salary_day = Math.min(28, Math.max(1, payload.salary_day));
  }

  if (payload.currency_code !== undefined) {
    data.currency_code = payload.currency_code.trim();
  }

  if (payload.currency_symbol !== undefined) {
    data.currency_symbol = payload.currency_symbol.trim();
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return safeUser(user);
};

const changePassword = async (userId: string, payload: IChangePassword) => {
  const { current_password, new_password } = payload;

  if (!current_password || !new_password.trim()) {
    throw new Error("Current and new password are required.");
  }

  if (new_password.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.auth_provider !== AuthProvider.CREDENTIAL || !user.password) {
    throw new Error("Password change is not available for this account.");
  }

  const isPasswordMatched = await bcrypt.compare(current_password, user.password);

  if (!isPasswordMatched) {
    throw new Error("Current password is incorrect.");
  }

  const hashedPassword = await bcrypt.hash(
    new_password,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return true;
};

export const userService = {
  getProfile,
  updateProfile,
  changePassword,
};
