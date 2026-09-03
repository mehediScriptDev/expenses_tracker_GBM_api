import { prisma } from "../../lib/prisma";
import { CategoryKind, TransactionType } from "../../generated/prisma/enums";
import { monthRange } from "../../utils/dateRanges";
import { ICreateBudget, IUpdateBudget } from "./budget.types";

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

const getMonthRange = () => monthRange();

const formatBudget = (budget: any, spent = 0) => {
  const remaining = budget.monthly_limit - spent;
  const pct =
    budget.monthly_limit > 0
      ? Math.round((spent / budget.monthly_limit) * 100)
      : 0;

  return {
    id: budget.id,
    user_id: budget.user_id,
    category_id: budget.category_id,
    monthly_limit: budget.monthly_limit,
    spent,
    remaining,
    pct,
    over: spent > budget.monthly_limit,
    category: budget.category
      ? {
          ...budget.category,
          kind: budget.category.kind.toLowerCase(),
        }
      : null,
    created_at: budget.created_at,
    updated_at: budget.updated_at,
  };
};

const getSpentByCategory = async (userId: string, categoryIds: string[]) => {
  if (categoryIds.length === 0) {
    return {} as Record<string, number>;
  }

  const { start, end } = getMonthRange();

  const totals = await prisma.transaction.groupBy({
    by: ["category_id"],
    where: {
      user_id: userId,
      category_id: { in: categoryIds },
      type: TransactionType.EXPENSE,
      occurred_at: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return totals.reduce(
    (acc, row) => {
      acc[row.category_id] = row._sum.amount ?? 0;
      return acc;
    },
    {} as Record<string, number>,
  );
};

const matchesBudgetStatus = (
  budget: ReturnType<typeof formatBudget>,
  status: string,
) => {
  if (!status || status === "all") {
    return true;
  }

  if (status === "over") {
    return budget.over;
  }

  if (status === "near-limit") {
    return !budget.over && budget.pct >= 85;
  }

  if (status === "on-track") {
    return !budget.over && budget.pct < 85;
  }

  return true;
};

const getBudgets = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const where: any = {
    user_id: userId,
  };

  if (query.category_id) {
    where.category_id = query.category_id;
  }

  if (query.search) {
    where.category = {
      name: {
        contains: query.search,
        mode: "insensitive",
      },
    };
  }

  const budgets = await prisma.budget.findMany({
    where,
    include: withCategory,
    orderBy: { created_at: "asc" },
  });

  const spentMap = await getSpentByCategory(
    userId,
    budgets.map((budget) => budget.category_id),
  );

  const status = query.status ?? "all";

  const formatted = budgets
    .map((budget) => formatBudget(budget, spentMap[budget.category_id] ?? 0))
    .filter((budget) => matchesBudgetStatus(budget, status))
    .sort((a, b) => b.pct - a.pct);

  const total = formatted.length;
  const skip = (page - 1) * limit;

  return {
    budgets: formatted.slice(skip, skip + limit),
    meta: {
      page,
      limit,
      total,
    },
  };
};

const createBudget = async (userId: string, payload: ICreateBudget) => {
  const monthlyLimit = Math.round(payload.monthly_limit);

  if (!monthlyLimit || monthlyLimit <= 0) {
    throw new Error("Enter a valid monthly limit.");
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

  if (category.kind !== CategoryKind.EXPENSE) {
    throw new Error("Budget can only be set for expense categories.");
  }

  const existing = await prisma.budget.findFirst({
    where: {
      user_id: userId,
      category_id: payload.category_id,
    },
  });

  if (existing) {
    throw new Error("Budget already exists for this category.");
  }

  const budget = await prisma.budget.create({
    data: {
      user_id: userId,
      category_id: payload.category_id,
      monthly_limit: monthlyLimit,
    },
    include: withCategory,
  });

  const spentMap = await getSpentByCategory(userId, [budget.category_id]);

  return formatBudget(budget, spentMap[budget.category_id] ?? 0);
};

const updateBudget = async (
  userId: string,
  id: string,
  payload: IUpdateBudget,
) => {
  const monthlyLimit = Math.round(payload.monthly_limit);

  if (!monthlyLimit || monthlyLimit <= 0) {
    throw new Error("Enter a valid monthly limit.");
  }

  const existing = await prisma.budget.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Budget not found.");
  }

  const budget = await prisma.budget.update({
    where: { id },
    data: {
      monthly_limit: monthlyLimit,
    },
    include: withCategory,
  });

  const spentMap = await getSpentByCategory(userId, [budget.category_id]);

  return formatBudget(budget, spentMap[budget.category_id] ?? 0);
};

const deleteBudget = async (userId: string, id: string) => {
  const existing = await prisma.budget.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Budget not found.");
  }

  await prisma.budget.delete({
    where: { id },
  });
};

export const budgetService = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
