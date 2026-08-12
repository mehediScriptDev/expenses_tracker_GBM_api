import { prisma } from "../../lib/prisma";
import { TransactionType } from "../../../generated/prisma/enums";
import {
  currentCalendarMonth,
  monthRangeFor,
} from "../../utils/dateRanges";
import { IMonthlySummary, ITopCategorySummary } from "./insights.types";

const formatSummary = (
  summary: {
    year: number;
    month: number;
    total_income: number;
    total_expenses: number;
    net_saved: number;
    transaction_count: number;
    top_categories: unknown;
  },
  isArchived: boolean,
): IMonthlySummary => ({
  year: summary.year,
  month: summary.month,
  total_income: summary.total_income,
  total_expenses: summary.total_expenses,
  net_saved: summary.net_saved,
  transaction_count: summary.transaction_count,
  top_categories: summary.top_categories as ITopCategorySummary[],
  is_archived: isArchived,
});

const buildTopCategories = async (
  userId: string,
  start: Date,
  end: Date,
): Promise<ITopCategorySummary[]> => {
  const rows = await prisma.transaction.groupBy({
    by: ["category_id"],
    where: {
      user_id: userId,
      type: TransactionType.EXPENSE,
      occurred_at: {
        gte: start,
        lt: end,
      },
    },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const sortedRows = [...rows].sort(
    (a, b) => (b._sum.amount ?? 0) - (a._sum.amount ?? 0),
  ).slice(0, 5);

  if (rows.length === 0) {
    return [];
  }

  const categories = await prisma.category.findMany({
    where: {
      user_id: userId,
      id: { in: rows.map((row) => row.category_id) },
    },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  });

  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return sortedRows
    .map((row) => {
      const category = categoryMap.get(row.category_id);

      if (!category) {
        return null;
      }

      return {
        category_id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        total: row._sum.amount ?? 0,
        count: row._count._all,
      };
    })
    .filter((row): row is ITopCategorySummary => row !== null);
};

const buildLiveMonthSummary = async (
  userId: string,
  year: number,
  month: number,
): Promise<IMonthlySummary> => {
  const { start, end } = monthRangeFor(year, month);

  const totals = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      user_id: userId,
      occurred_at: {
        gte: start,
        lt: end,
      },
    },
    _sum: { amount: true },
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const row of totals) {
    const amount = row._sum.amount ?? 0;

    if (row.type === TransactionType.INCOME) {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }
  }

  const transactionCount = await prisma.transaction.count({
    where: {
      user_id: userId,
      occurred_at: {
        gte: start,
        lt: end,
      },
    },
  });

  const topCategories = await buildTopCategories(userId, start, end);

  return {
    year,
    month,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_saved: totalIncome - totalExpenses,
    transaction_count: transactionCount,
    top_categories: topCategories,
    is_archived: false,
  };
};

const getSummaries = async (userId: string) => {
  const archived = await prisma.monthlySummary.findMany({
    where: { user_id: userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const { year: currentYear, month: currentMonth } = currentCalendarMonth();

  const hasCurrentArchived = archived.some(
    (summary) => summary.year === currentYear && summary.month === currentMonth,
  );

  const summaries: IMonthlySummary[] = archived.map((summary) =>
    formatSummary(summary, true),
  );

  if (!hasCurrentArchived) {
    const live = await buildLiveMonthSummary(userId, currentYear, currentMonth);
    summaries.unshift(live);
  }

  return summaries;
};

const getSummary = async (userId: string, year: number, month: number) => {
  if (month < 1 || month > 12) {
    throw new Error("Invalid month.");
  }

  const archived = await prisma.monthlySummary.findUnique({
    where: {
      user_id_year_month: {
        user_id: userId,
        year,
        month,
      },
    },
  });

  if (archived) {
    return formatSummary(archived, true);
  }

  const { year: currentYear, month: currentMonth } = currentCalendarMonth();

  if (year === currentYear && month === currentMonth) {
    return buildLiveMonthSummary(userId, year, month);
  }

  const { start, end } = monthRangeFor(year, month);
  const hasTransactions = await prisma.transaction.count({
    where: {
      user_id: userId,
      occurred_at: {
        gte: start,
        lt: end,
      },
    },
  });

  if (hasTransactions > 0) {
    return buildLiveMonthSummary(userId, year, month);
  }

  throw new Error("Summary not found.");
};

const getCurrentMonth = async (userId: string) => {
  const { year, month } = currentCalendarMonth();
  return buildLiveMonthSummary(userId, year, month);
};

export const insightsService = {
  getSummaries,
  getSummary,
  getCurrentMonth,
  buildTopCategories,
  buildLiveMonthSummary,
};
