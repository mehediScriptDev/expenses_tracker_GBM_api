import { prisma } from "../../lib/prisma";
import { LoanDirection } from "../../../generated/prisma/enums";
import { ICreateLoan, IRepayLoan, IUpdateLoan } from "./loan.types";

const toDateString = (value: Date | null) => {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
};

const getStatus = (loan: {
  amount: number;
  amount_repaid: number;
  due_on: Date | null;
}) => {
  if (loan.amount_repaid >= loan.amount) {
    return "paid";
  }

  if (loan.due_on) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(loan.due_on);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      return "overdue";
    }
  }

  if (loan.amount_repaid > 0) {
    return "partial";
  }

  return "unpaid";
};

const formatLoan = (loan: any) => {
  const remaining = loan.amount - loan.amount_repaid;
  const pct =
    loan.amount > 0 ? Math.round((loan.amount_repaid / loan.amount) * 100) : 0;

  return {
    ...loan,
    direction: loan.direction.toLowerCase(),
    started_on: toDateString(loan.started_on),
    due_on: toDateString(loan.due_on),
    remaining,
    pct,
    status: getStatus(loan),
  };
};

const getLoans = async (userId: string, query: any) => {
  const where: any = {
    user_id: userId,
  };

  if (query.direction && query.direction !== "all") {
    where.direction = query.direction.toUpperCase();
  }

  if (query.search) {
    where.OR = [
      {
        person: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        reason: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { started_on: "desc" },
  });

  const formatted = loans.map(formatLoan);

  if (query.status && query.status !== "all") {
    return formatted.filter((loan) => loan.status === query.status);
  }

  return formatted;
};

const createLoan = async (userId: string, payload: ICreateLoan) => {
  const amount = Math.round(payload.amount);

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  if (!payload.person?.trim()) {
    throw new Error("Person name is required.");
  }

  const amountRepaid = Math.round(payload.amount_repaid ?? 0);

  if (amountRepaid < 0 || amountRepaid > amount) {
    throw new Error("Repaid amount must be between 0 and the loan amount.");
  }

  const loan = await prisma.loan.create({
    data: {
      user_id: userId,
      direction: payload.direction.toUpperCase() as LoanDirection,
      person: payload.person.trim(),
      amount,
      amount_repaid: amountRepaid,
      started_on: new Date(`${payload.started_on}T00:00:00`),
      due_on: payload.due_on
        ? new Date(`${payload.due_on}T00:00:00`)
        : null,
      reason: payload.reason?.trim() || null,
      notes: payload.notes?.trim() || null,
    },
  });

  return formatLoan(loan);
};

const updateLoan = async (userId: string, id: string, payload: IUpdateLoan) => {
  const existing = await prisma.loan.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Loan not found.");
  }

  const amount = payload.amount ? Math.round(payload.amount) : existing.amount;

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const amountRepaid =
    payload.amount_repaid !== undefined
      ? Math.round(payload.amount_repaid)
      : existing.amount_repaid;

  if (amountRepaid < 0 || amountRepaid > amount) {
    throw new Error("Repaid amount must be between 0 and the loan amount.");
  }

  const loan = await prisma.loan.update({
    where: { id },
    data: {
      direction: payload.direction
        ? (payload.direction.toUpperCase() as LoanDirection)
        : existing.direction,
      person: payload.person?.trim() ?? existing.person,
      amount,
      amount_repaid: amountRepaid,
      started_on: payload.started_on
        ? new Date(`${payload.started_on}T00:00:00`)
        : existing.started_on,
      due_on:
        payload.due_on === null
          ? null
          : payload.due_on
            ? new Date(`${payload.due_on}T00:00:00`)
            : existing.due_on,
      reason:
        payload.reason === null
          ? null
          : payload.reason !== undefined
            ? payload.reason.trim() || null
            : existing.reason,
      notes:
        payload.notes === null
          ? null
          : payload.notes !== undefined
            ? payload.notes.trim() || null
            : existing.notes,
    },
  });

  return formatLoan(loan);
};

const repayLoan = async (userId: string, id: string, payload: IRepayLoan) => {
  const payment = Math.round(payload.amount);

  if (!payment || payment <= 0) {
    throw new Error("Enter a valid payment amount.");
  }

  const existing = await prisma.loan.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Loan not found.");
  }

  const amountRepaid = Math.min(existing.amount_repaid + payment, existing.amount);

  const loan = await prisma.loan.update({
    where: { id },
    data: {
      amount_repaid: amountRepaid,
    },
  });

  return formatLoan(loan);
};

const deleteLoan = async (userId: string, id: string) => {
  const existing = await prisma.loan.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Loan not found.");
  }

  await prisma.loan.delete({
    where: { id },
  });
};

export const loanService = {
  getLoans,
  createLoan,
  updateLoan,
  repayLoan,
  deleteLoan,
};
