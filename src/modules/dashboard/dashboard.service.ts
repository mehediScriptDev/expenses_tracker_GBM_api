import { prisma } from "../../lib/prisma";
import { LoanDirection, TransactionType } from "../../generated/prisma/enums";
import {
  DateRange,
  monthRange,
  todayRange,
  weekRange,
} from "../../utils/dateRanges";
import { cycleService } from "../cycle/cycle.service";

const sumExpensesInRange = async (userId: string, range: DateRange) => {
  const result = await prisma.transaction.aggregate({
    where: {
      user_id: userId,
      type: TransactionType.EXPENSE,
      occurred_at: {
        gte: range.start,
        lt: range.end,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount ?? 0;
};

const getBorrowedSummary = async (userId: string, now = new Date()) => {
  const loans = await prisma.loan.findMany({
    where: {
      user_id: userId,
      direction: LoanDirection.BORROWED,
    },
    orderBy: { due_on: "asc" },
  });

  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  let borrowedOutstanding = 0;
  let borrowedTotal = 0;
  let borrowedRepaid = 0;
  let overdueCount = 0;
  let nextDue: { person: string; due_on: string } | null = null;

  for (const loan of loans) {
    const remaining = Math.max(0, loan.amount - loan.amount_repaid);
    borrowedOutstanding += remaining;
    borrowedTotal += loan.amount;
    borrowedRepaid += Math.min(loan.amount_repaid, loan.amount);

    if (remaining <= 0 || !loan.due_on) {
      continue;
    }

    const due = new Date(loan.due_on).getTime();
    const daysUntil = Math.ceil((due - startToday) / 86400000);

    if (daysUntil < 0) {
      overdueCount += 1;
    } else if (!nextDue) {
      nextDue = {
        person: loan.person,
        due_on: loan.due_on.toISOString().slice(0, 10),
      };
    }
  }

  return {
    borrowed_outstanding: borrowedOutstanding,
    borrowed_repaid_pct:
      borrowedTotal > 0 ? Math.round((borrowedRepaid / borrowedTotal) * 100) : 100,
    borrowed_overdue_count: overdueCount,
    next_due: nextDue,
  };
};

const getDashboard = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      monthly_salary: true,
      salary_day: true,
      currency_code: true,
      currency_symbol: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const now = new Date();
  const { carry_over, cycle } = await cycleService.ensureCycleRolled(userId);
  const totals = await cycleService.aggregateCycleTotals(userId, cycle);

  const [
    todaySpending,
    weekSpending,
    monthSpending,
    borrowedSummary,
  ] = await Promise.all([
    sumExpensesInRange(userId, todayRange(now)),
    sumExpensesInRange(userId, weekRange(now)),
    sumExpensesInRange(userId, monthRange(now)),
    getBorrowedSummary(userId, now),
  ]);

  const cycleIncome = totals.income;
  const cycleExpenses = totals.expenses;
  const available = carry_over + cycleIncome - cycleExpenses;
  const benchmarkSalary = user.monthly_salary ?? 0;
  const benchmarkRemaining = benchmarkSalary - cycleExpenses;
  const safeDailyLimit =
    cycle.days_remaining > 0
      ? Math.max(0, available) / cycle.days_remaining
      : Math.max(0, available);

  return {
    carry_over,
    cycle_income: cycleIncome,
    cycle_expenses: cycleExpenses,
    available,
    benchmark_salary: benchmarkSalary,
    benchmark_remaining: benchmarkRemaining,
    safe_daily_limit: Math.round(safeDailyLimit),
    today_spending: todaySpending,
    week_spending: weekSpending,
    month_spending: monthSpending,
    ...borrowedSummary,
    cycle: {
      start: cycle.start.toISOString(),
      end: cycle.end.toISOString(),
      days_remaining: cycle.days_remaining,
      days_elapsed: cycle.days_elapsed,
      total_days: cycle.total_days,
    },
    currency_code: user.currency_code,
    currency_symbol: user.currency_symbol,
    salary_day: user.salary_day,
  };
};

export const dashboardService = {
  getDashboard,
};
