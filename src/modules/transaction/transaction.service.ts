import { prisma } from "../../lib/prisma";
import {
  Mood,
  PaymentMethod,
  TransactionType,
} from "../../../generated/prisma/enums";
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

const formatTx = (tx: any) => {
  return {
    ...tx,
    type: tx.type.toLowerCase(),
    payment_method: tx.payment_method.toLowerCase(),
    mood: tx.mood ? tx.mood.toLowerCase() : null,
    date: tx.occurred_at.toISOString().slice(0, 10),
    time: tx.occurred_at.toTimeString().slice(0, 5),
  };
};

const getTransactions = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

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
      occurred_at: new Date(`${payload.date}T${payload.time}:00`),
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
          ? new Date(`${payload.date}T${payload.time}:00`)
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
