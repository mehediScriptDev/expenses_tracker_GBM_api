import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import config from "../../config";

interface UserPayload {
  name: string;
  email: string;
  password: string;
}

const registerUserIntoDb = async (payload: UserPayload) => {
   const { name, email, password } = payload;
    const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (isUserExist) {
    throw new Error("User already exist with this email");
  }
  const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

  const user = await prisma.user.create({
    data:{
        name,
        email,
        password: hashedPassword
    }
  })
  return user;
}

export const userService = {
    registerUserIntoDb
}