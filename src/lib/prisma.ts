import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const rawDbUrl = process.env.DATABASE_URL;
const dbUrl = rawDbUrl ? rawDbUrl.trim().replace(/^["']|["']$/g, "") : "";

if (!dbUrl) {
  console.error("❌ CRITICAL: DATABASE_URL is not defined in environment variables!");
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

export { prisma };