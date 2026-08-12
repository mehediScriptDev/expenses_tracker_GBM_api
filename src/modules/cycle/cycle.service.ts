import { prisma } from "../../lib/prisma";
import { TransactionType } from "../../../generated/prisma/enums";
import { DateRange, nextCycleStart, payCycle } from "../../utils/dateRanges";

const aggregateCycleTotals = async (userId: string, range: DateRange) => {
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      user_id: userId,
      occurred_at: {
        gte: range.start,
        lt: range.end,
      },
    },
    _sum: {
      amount: true,
    },
  });

  let income = 0;
  let expenses = 0;

  for (const row of rows) {
    const amount = row._sum.amount ?? 0;

    if (row.type === TransactionType.INCOME) {
      income += amount;
    } else {
      expenses += amount;
    }
  }

  return { income, expenses };
};

export interface CycleContext {
  carry_over: number;
  cycle: ReturnType<typeof payCycle>;
}

export const ensureCycleRolled = async (userId: string): Promise<CycleContext> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      salary_day: true,
      carry_over_balance: true,
      current_cycle_start: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const cycle = payCycle(user.salary_day);
  let carryOver = user.carry_over_balance;
  let cycleStart = user.current_cycle_start;

  if (!cycleStart) {
    await prisma.user.update({
      where: { id: userId },
      data: { current_cycle_start: cycle.start },
    });

    return { carry_over: carryOver, cycle };
  }

  if (cycleStart.getTime() === cycle.start.getTime()) {
    return { carry_over: carryOver, cycle };
  }

  let cursor = new Date(cycleStart);

  while (cursor.getTime() < cycle.start.getTime()) {
    const rangeEnd = nextCycleStart(cursor, user.salary_day);
    const totals = await aggregateCycleTotals(userId, {
      start: cursor,
      end: rangeEnd,
    });

    carryOver = carryOver + totals.income - totals.expenses;
    cursor = rangeEnd;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      carry_over_balance: carryOver,
      current_cycle_start: cycle.start,
    },
  });

  return { carry_over: carryOver, cycle };
};

export const cycleService = {
  ensureCycleRolled,
  aggregateCycleTotals,
};
