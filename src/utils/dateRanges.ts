export interface DateRange {
  start: Date;
  end: Date;
}

export interface PayCycle extends DateRange {
  days_remaining: number;
  days_elapsed: number;
  total_days: number;
}

const clampSalaryDay = (salaryDay: number) =>
  Math.min(Math.max(salaryDay, 1), 28);

export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const monthRange = (now = new Date()): DateRange => ({
  start: new Date(now.getFullYear(), now.getMonth(), 1),
  end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
});

export const monthRangeFor = (year: number, month: number): DateRange => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 1),
});

export const payCycle = (salaryDay: number, now = new Date()): PayCycle => {
  const day = clampSalaryDay(salaryDay);
  let start: Date;

  if (now.getDate() >= day) {
    start = new Date(now.getFullYear(), now.getMonth(), day);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 1, day);
  }

  const end = new Date(start.getFullYear(), start.getMonth() + 1, day);
  const today = startOfDay(now);
  const daysRemaining = Math.max(
    0,
    Math.round((end.getTime() - today.getTime()) / 86400000),
  );
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  const daysElapsed = totalDays - daysRemaining;

  return {
    start,
    end,
    days_remaining: daysRemaining,
    days_elapsed: daysElapsed,
    total_days: totalDays,
  };
};

export const nextCycleStart = (cycleStart: Date, salaryDay: number) => {
  const day = clampSalaryDay(salaryDay);
  return new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, day);
};

export const retentionCutoff = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth() - 2, 1);
