import { prisma } from "../../lib/prisma";
import { LoanDirection, TransactionType } from "../../generated/prisma/enums";
import { monthRange } from "../../utils/dateRanges";
import { INotification, IMarkRead, NotificationType } from "./notification.types";

const TYPE_RANK: Record<NotificationType, number> = {
  BUDGET_LIMIT_EXCEEDED: 0,
  DEBT_DUE_SOON: 1,
  BUDGET_LIMIT_WARNING: 2,
  GOAL_MILESTONE: 3,
};

const DAY_MS = 86400000;

const formatMoney = (amount: number, symbol: string) =>
  `${symbol}${amount.toLocaleString("en-US")}`;

const pctChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / previous) * 100;
};

const buildNotifications = async (
  userId: string,
  now = new Date(),
): Promise<Omit<INotification, "read">[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency_symbol: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const symbol = user.currency_symbol;
  const out: Omit<INotification, "read">[] = [];
  const month = monthRange(now);
  const lastMonth = {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 1),
  };

  const budgets = await prisma.budget.findMany({
    where: { user_id: userId },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  const categoryIds = budgets.map((budget) => budget.category_id);

  const [currentSpent, lastSpent] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["category_id"],
      where: {
        user_id: userId,
        category_id: { in: categoryIds },
        type: TransactionType.EXPENSE,
        occurred_at: { gte: month.start, lt: month.end },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["category_id"],
      where: {
        user_id: userId,
        category_id: { in: categoryIds },
        type: TransactionType.EXPENSE,
        occurred_at: { gte: lastMonth.start, lt: lastMonth.end },
      },
      _sum: { amount: true },
    }),
  ]);

  const currentMap = new Map(
    currentSpent.map((row) => [row.category_id, row._sum.amount ?? 0]),
  );
  const lastMap = new Map(
    lastSpent.map((row) => [row.category_id, row._sum.amount ?? 0]),
  );

  for (const budget of budgets) {
    const spent = currentMap.get(budget.category_id) ?? 0;
    const pct =
      budget.monthly_limit > 0
        ? Math.round((spent / budget.monthly_limit) * 100)
        : 0;
    const categoryName = budget.category?.name ?? "Category";
    const createdAt = now.toISOString();

    if (spent > budget.monthly_limit) {
      out.push({
        id: `budget-exceeded-${budget.category_id}`,
        type: "BUDGET_LIMIT_EXCEEDED",
        message: `You've exceeded your ${categoryName} budget by ${formatMoney(spent - budget.monthly_limit, symbol)}.`,
        href: "/budgets",
        created_at: createdAt,
      });
    } else if (pct >= 80) {
      out.push({
        id: `budget-warning-${budget.category_id}`,
        type: "BUDGET_LIMIT_WARNING",
        message: `You've used ${pct}% of your ${categoryName} budget.`,
        href: "/budgets",
        created_at: createdAt,
      });
    }

    const prev = lastMap.get(budget.category_id) ?? 0;
    const cur = currentMap.get(budget.category_id) ?? 0;

    if (prev > 0) {
      const change = pctChange(cur, prev);

      if (change >= 4 && !out.some((item) => item.id === `budget-spike-${budget.category_id}`)) {
        out.push({
          id: `budget-spike-${budget.category_id}`,
          type: "BUDGET_LIMIT_WARNING",
          message: `Your ${categoryName} spending is ${Math.round(change)}% higher than last month.`,
          href: "/budgets",
          created_at: createdAt,
        });
      }
    }
  }

  const goals = await prisma.goal.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  for (const goal of goals) {
    if (goal.target_amount <= 0) {
      continue;
    }

    const pct = (goal.current_amount / goal.target_amount) * 100;
    const createdAt = goal.created_at.toISOString();

    if (pct >= 50 && pct < 100) {
      out.push({
        id: `goal-milestone-50-${goal.id}`,
        type: "GOAL_MILESTONE",
        message: `You're halfway to your ${goal.title} goal!`,
        href: "/goals",
        created_at: createdAt,
      });
    } else if (pct >= 100) {
      out.push({
        id: `goal-milestone-100-${goal.id}`,
        type: "GOAL_MILESTONE",
        message: `You reached your ${goal.title} goal — great work!`,
        href: "/goals",
        created_at: createdAt,
      });
    }
  }

  const loans = await prisma.loan.findMany({
    where: {
      user_id: userId,
      direction: LoanDirection.BORROWED,
    },
  });

  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  for (const loan of loans) {
    const remaining = loan.amount - loan.amount_repaid;

    if (remaining <= 0 || !loan.due_on) {
      continue;
    }

    const due = new Date(loan.due_on).getTime();
    const daysUntil = Math.ceil((due - startToday) / DAY_MS);
    const status = daysUntil < 0 ? "overdue" : daysUntil <= 7 ? "soon" : null;

    if (!status) {
      continue;
    }

    out.push({
      id: `debt-${loan.id}-${status}`,
      type: "DEBT_DUE_SOON",
      message:
        daysUntil < 0
          ? `Payment to ${loan.person} is overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"}.`
          : daysUntil === 0
            ? `Payment to ${loan.person} is due today.`
            : `Payment to ${loan.person} is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`,
      href: "/borrowed",
      created_at: loan.created_at.toISOString(),
    });
  }

  return out.sort((a, b) => {
    const timeDiff =
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return TYPE_RANK[a.type] - TYPE_RANK[b.type];
  });
};

const attachReadState = async (
  userId: string,
  notifications: Omit<INotification, "read">[],
): Promise<INotification[]> => {
  if (notifications.length === 0) {
    return [];
  }

  const readRows = await prisma.notificationRead.findMany({
    where: {
      user_id: userId,
      notification_key: {
        in: notifications.map((item) => item.id),
      },
    },
    select: { notification_key: true },
  });

  const readSet = new Set(readRows.map((row) => row.notification_key));

  return notifications.map((item) => ({
    ...item,
    read: readSet.has(item.id),
  }));
};

const getNotifications = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const built = await buildNotifications(userId);
  const notificationsWithRead = await attachReadState(userId, built);
  const unreadCount = notificationsWithRead.filter((item) => !item.read).length;

  let notifications = notificationsWithRead;

  if (query.unread_only === "true") {
    notifications = notifications.filter((item) => !item.read);
  }

  const total = notifications.length;
  const skip = (page - 1) * limit;

  return {
    notifications: notifications.slice(skip, skip + limit),
    meta: {
      page,
      limit,
      total,
      unread_count: unreadCount,
    },
  };
};

const markRead = async (userId: string, payload: IMarkRead) => {
  if (payload.mark_all) {
    const built = await buildNotifications(userId);

    await prisma.$transaction(
      built.map((item) =>
        prisma.notificationRead.upsert({
          where: {
            user_id_notification_key: {
              user_id: userId,
              notification_key: item.id,
            },
          },
          create: {
            user_id: userId,
            notification_key: item.id,
          },
          update: {},
        }),
      ),
    );

    return true;
  }

  if (!payload.notification_key?.trim()) {
    throw new Error("notification_key is required.");
  }

  await prisma.notificationRead.upsert({
    where: {
      user_id_notification_key: {
        user_id: userId,
        notification_key: payload.notification_key.trim(),
      },
    },
    create: {
      user_id: userId,
      notification_key: payload.notification_key.trim(),
    },
    update: {},
  });

  return true;
};

const clearReadState = async (userId: string) => {
  await prisma.notificationRead.deleteMany({
    where: { user_id: userId },
  });
};

export const notificationService = {
  getNotifications,
  markRead,
  clearReadState,
};
