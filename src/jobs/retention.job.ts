import { prisma } from "../lib/prisma";
import { monthRangeFor, retentionCutoff } from "../utils/dateRanges";
import { insightsService } from "../modules/insights/insights.service";

const getMonthsToArchive = async (userId: string, cutoff: Date) => {
  const rows = await prisma.$queryRaw<Array<{ year: number; month: number }>>`
    SELECT
      EXTRACT(YEAR FROM occurred_at)::int AS year,
      EXTRACT(MONTH FROM occurred_at)::int AS month
    FROM transactions
    WHERE user_id = ${userId}
      AND occurred_at < ${cutoff}
    GROUP BY 1, 2
    ORDER BY 1 ASC, 2 ASC
  `;

  return rows;
};

const archiveMonth = async (userId: string, year: number, month: number) => {
  const existing = await prisma.monthlySummary.findUnique({
    where: {
      user_id_year_month: {
        user_id: userId,
        year,
        month,
      },
    },
  });

  if (existing) {
    const { start, end } = monthRangeFor(year, month);

    await prisma.transaction.deleteMany({
      where: {
        user_id: userId,
        occurred_at: {
          gte: start,
          lt: end,
        },
      },
    });

    return;
  }

  const summary = await insightsService.buildLiveMonthSummary(userId, year, month);

  await prisma.$transaction([
    prisma.monthlySummary.create({
      data: {
        user_id: userId,
        year,
        month,
        total_income: summary.total_income,
        total_expenses: summary.total_expenses,
        net_saved: summary.net_saved,
        transaction_count: summary.transaction_count,
        top_categories: summary.top_categories as object,
      },
    }),
    prisma.transaction.deleteMany({
      where: {
        user_id: userId,
        occurred_at: {
          gte: monthRangeFor(year, month).start,
          lt: monthRangeFor(year, month).end,
        },
      },
    }),
  ]);
};

const archiveUser = async (userId: string) => {
  const cutoff = retentionCutoff();
  const months = await getMonthsToArchive(userId, cutoff);

  for (const { year, month } of months) {
    await archiveMonth(userId, year, month);
  }
};

const runRetentionJob = async () => {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  let archivedMonths = 0;

  for (const user of users) {
    const cutoff = retentionCutoff();
    const months = await getMonthsToArchive(user.id, cutoff);
    archivedMonths += months.length;

    await archiveUser(user.id);
  }

  if (archivedMonths > 0) {
    console.log(`Retention job archived ${archivedMonths} month(s).`);
  }
};

const startRetentionScheduler = () => {
  const dayMs = 24 * 60 * 60 * 1000;

  runRetentionJob().catch((error) => {
    console.error("Retention job failed on startup:", error);
  });

  setInterval(() => {
    runRetentionJob().catch((error) => {
      console.error("Retention job failed:", error);
    });
  }, dayMs);
};

export const retentionJob = {
  runRetentionJob,
  startRetentionScheduler,
};
