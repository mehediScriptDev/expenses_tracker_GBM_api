import { prisma } from "../../lib/prisma";
import {
  Mood,
  PaymentMethod,
  TransactionType,
} from "../../generated/prisma/enums";
import { monthRange } from "../../utils/dateRanges";
import { cycleService } from "../cycle/cycle.service";
import { ICreateTransaction, IUpdateTransaction } from "./transaction.types";

const withCategory = {
  category: {
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      kind: true,
    },
  },
};

const wallClockToDate = (date: string, time: string) => {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, hh, mm));
};

const formatWallClock = (value: Date) => {
  const date = `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
  const time = `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
  return { date, time };
};

const formatTx = (tx: any) => {
  const wallClock = formatWallClock(tx.occurred_at);

  return {
    ...tx,
    type: tx.type.toLowerCase(),
    payment_method: tx.payment_method.toLowerCase(),
    mood: tx.mood ? tx.mood.toLowerCase() : null,
    date: wallClock.date,
    time: wallClock.time,
  };
};

const getTransactions = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const scope = query.scope ?? "current_cycle";

  const where: any = {
    user_id: userId,
  };

  if (query.type && query.type !== "all") {
    where.type = query.type.toUpperCase();
  }

  if (query.search) {
    where.description = {
      contains: query.search,
      mode: "insensitive",
    };
  }

  if (scope === "current_cycle") {
    const { cycle } = await cycleService.ensureCycleRolled(userId);
    where.occurred_at = {
      gte: cycle.start,
      lt: cycle.end,
    };
  } else if (scope === "current_month") {
    const month = monthRange();
    where.occurred_at = {
      gte: month.start,
      lt: month.end,
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: withCategory,
    orderBy: { occurred_at: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.transaction.count({ where });

  return {
    transactions: transactions.map(formatTx),
    meta: {
      page,
      limit,
      total,
    },
  };
};

const createTransaction = async (userId: string, payload: ICreateTransaction) => {
  await cycleService.ensureCycleRolled(userId);

  const amount = Math.round(payload.amount);

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const category = await prisma.category.findFirst({
    where: {
      id: payload.category_id,
      user_id: userId,
    },
  });

  if (!category) {
    throw new Error("Category not found.");
  }

  const type = payload.type.toUpperCase() as TransactionType;

  const transaction = await prisma.transaction.create({
    data: {
      user_id: userId,
      category_id: payload.category_id,
      type,
      amount,
      description: payload.description?.trim() || "Untitled",
      payment_method: payload.payment_method.toUpperCase() as PaymentMethod,
      mood:
        type === TransactionType.EXPENSE && payload.mood
          ? (payload.mood.toUpperCase() as Mood)
          : null,
      occurred_at: wallClockToDate(payload.date, payload.time),
    },
    include: withCategory,
  });

  return formatTx(transaction);
};

const updateTransaction = async (
  userId: string,
  id: string,
  payload: IUpdateTransaction,
) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Transaction not found.");
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      type: payload.type
        ? (payload.type.toUpperCase() as TransactionType)
        : existing.type,
      amount: payload.amount ? Math.round(payload.amount) : existing.amount,
      category_id: payload.category_id ?? existing.category_id,
      description: payload.description ?? existing.description,
      payment_method: payload.payment_method
        ? (payload.payment_method.toUpperCase() as PaymentMethod)
        : existing.payment_method,
      mood: payload.mood
        ? (payload.mood.toUpperCase() as Mood)
        : payload.mood === null
          ? null
          : existing.mood,
      occurred_at:
        payload.date && payload.time
          ? wallClockToDate(payload.date, payload.time)
          : existing.occurred_at,
    },
    include: withCategory,
  });

  return formatTx(transaction);
};

const deleteTransaction = async (userId: string, id: string) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Transaction not found.");
  }

  await prisma.transaction.delete({
    where: { id },
  });
};

const duplicateTransaction = async (userId: string, id: string) => {
  const existing = await prisma.transaction.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Transaction not found.");
  }

  const transaction = await prisma.transaction.create({
    data: {
      user_id: userId,
      category_id: existing.category_id,
      type: existing.type,
      amount: existing.amount,
      description: existing.description,
      payment_method: existing.payment_method,
      mood: existing.mood,
      tags: existing.tags,
      occurred_at: new Date(),
    },
    include: withCategory,
  });

  return formatTx(transaction);
};

export const transactionService = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  duplicateTransaction,
};
