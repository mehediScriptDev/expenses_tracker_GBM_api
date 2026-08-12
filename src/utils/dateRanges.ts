export interface DateRange {
  start: Date;
  end: Date;
}

export interface PayCycle extends DateRange {
  days_remaining: number;
  days_elapsed: number;
  total_days: number;
}

const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Dhaka";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const clampSalaryDay = (salaryDay: number) =>
  Math.min(Math.max(salaryDay, 1), 28);

/** Matches transaction.service wallClockToDate — calendar Y-M-D stored as UTC. */
export const wallClockUtc = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day));

const calendarParts = (date: Date, timeZone = DEFAULT_TIMEZONE) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(date);

  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const weekday =
    WEEKDAY_INDEX[parts.find((part) => part.type === "weekday")?.value ?? "Mon"] ??
    0;

  return {
    year: num("year"),
    month: num("month"),
    day: num("day"),
    weekday,
  };
};

export const startOfDay = (date: Date, timeZone = DEFAULT_TIMEZONE) => {
  const { year, month, day } = calendarParts(date, timeZone);
  return wallClockUtc(year, month, day);
};

export const monthRange = (now = new Date(), timeZone = DEFAULT_TIMEZONE): DateRange => {
  const { year, month } = calendarParts(now, timeZone);
  return {
    start: wallClockUtc(year, month, 1),
    end: wallClockUtc(year, month + 1, 1),
  };
};

export const monthRangeFor = (year: number, month: number): DateRange => ({
  start: wallClockUtc(year, month, 1),
  end: wallClockUtc(year, month + 1, 1),
});

export const todayRange = (now = new Date(), timeZone = DEFAULT_TIMEZONE): DateRange => {
  const { year, month, day } = calendarParts(now, timeZone);
  return {
    start: wallClockUtc(year, month, day),
    end: wallClockUtc(year, month, day + 1),
  };
};

export const weekRange = (now = new Date(), timeZone = DEFAULT_TIMEZONE): DateRange => {
  const { year, month, day, weekday } = calendarParts(now, timeZone);
  const mondayOffset = (weekday + 6) % 7;

  return {
    start: wallClockUtc(year, month, day - mondayOffset),
    end: wallClockUtc(year, month, day - mondayOffset + 7),
  };
};

export const payCycle = (
  salaryDay: number,
  now = new Date(),
  timeZone = DEFAULT_TIMEZONE,
): PayCycle => {
  const day = clampSalaryDay(salaryDay);
  const { year, month, day: todayDay } = calendarParts(now, timeZone);

  let startYear = year;
  let startMonth = month;

  if (todayDay < day) {
    startMonth -= 1;
    if (startMonth < 1) {
      startMonth = 12;
      startYear -= 1;
    }
  }

  const start = wallClockUtc(startYear, startMonth, day);

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 12) {
    endMonth = 1;
    endYear += 1;
  }

  const end = wallClockUtc(endYear, endMonth, day);
  const today = wallClockUtc(year, month, todayDay);
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
  const year = cycleStart.getUTCFullYear();
  const month = cycleStart.getUTCMonth() + 1;
  return wallClockUtc(year, month + 1, day);
};

export const retentionCutoff = (now = new Date(), timeZone = DEFAULT_TIMEZONE) => {
  const { year, month } = calendarParts(now, timeZone);
  return wallClockUtc(year, month - 2, 1);
};

export const currentCalendarMonth = (
  now = new Date(),
  timeZone = DEFAULT_TIMEZONE,
) => {
  const { year, month } = calendarParts(now, timeZone);
  return { year, month };
};
