import { prisma } from "../../lib/prisma";
import { ICreateGoal, IDepositGoal, IUpdateGoal } from "./goal.types";

const toDateString = (value: Date | null) => {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
};

const formatGoal = (goal: any) => {
  const pct =
    goal.target_amount > 0
      ? Math.round((goal.current_amount / goal.target_amount) * 100)
      : 0;

  return {
    ...goal,
    target_date: toDateString(goal.target_date),
    pct,
    completed: goal.current_amount >= goal.target_amount,
  };
};

const getGoals = async (userId: string, query: any) => {
  const where: any = {
    user_id: userId,
  };

  if (query.search) {
    where.title = {
      contains: query.search,
      mode: "insensitive",
    };
  }

  const goals = await prisma.goal.findMany({
    where,
    orderBy: { created_at: "desc" },
  });

  const formatted = goals.map(formatGoal);

  if (query.status === "completed") {
    return formatted.filter((goal) => goal.completed);
  }

  if (query.status === "in-progress") {
    return formatted.filter((goal) => !goal.completed);
  }

  return formatted;
};

const createGoal = async (userId: string, payload: ICreateGoal) => {
  if (!payload.title?.trim()) {
    throw new Error("Goal title is required.");
  }

  const targetAmount = Math.round(payload.target_amount);

  if (!targetAmount || targetAmount <= 0) {
    throw new Error("Enter a valid target amount.");
  }

  const currentAmount = Math.round(payload.current_amount ?? 0);

  if (currentAmount < 0) {
    throw new Error("Current amount cannot be negative.");
  }

  const goal = await prisma.goal.create({
    data: {
      user_id: userId,
      title: payload.title.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: payload.target_date
        ? new Date(`${payload.target_date}T00:00:00`)
        : null,
      icon: payload.icon ?? "piggy-bank",
      color: payload.color ?? "var(--chart-4)",
    },
  });

  return formatGoal(goal);
};

const updateGoal = async (userId: string, id: string, payload: IUpdateGoal) => {
  const existing = await prisma.goal.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Goal not found.");
  }

  const targetAmount = payload.target_amount
    ? Math.round(payload.target_amount)
    : existing.target_amount;

  if (!targetAmount || targetAmount <= 0) {
    throw new Error("Enter a valid target amount.");
  }

  const currentAmount =
    payload.current_amount !== undefined
      ? Math.round(payload.current_amount)
      : existing.current_amount;

  if (currentAmount < 0) {
    throw new Error("Current amount cannot be negative.");
  }

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      title: payload.title?.trim() ?? existing.title,
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date:
        payload.target_date === null
          ? null
          : payload.target_date
            ? new Date(`${payload.target_date}T00:00:00`)
            : existing.target_date,
      icon: payload.icon ?? existing.icon,
      color: payload.color ?? existing.color,
    },
  });

  return formatGoal(goal);
};

const depositGoal = async (userId: string, id: string, payload: IDepositGoal) => {
  const amount = Math.round(payload.amount);

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid deposit amount.");
  }

  const existing = await prisma.goal.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Goal not found.");
  }

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      current_amount: existing.current_amount + amount,
    },
  });

  return formatGoal(goal);
};

const deleteGoal = async (userId: string, id: string) => {
  const existing = await prisma.goal.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Goal not found.");
  }

  await prisma.goal.delete({
    where: { id },
  });
};

export const goalService = {
  getGoals,
  createGoal,
  updateGoal,
  depositGoal,
  deleteGoal,
};
