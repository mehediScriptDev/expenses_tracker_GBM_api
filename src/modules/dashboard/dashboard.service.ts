import { prisma } from "../../lib/prisma";
import { cycleService } from "../cycle/cycle.service";

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

  const { carry_over, cycle } = await cycleService.ensureCycleRolled(userId);
  const totals = await cycleService.aggregateCycleTotals(userId, cycle);

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
