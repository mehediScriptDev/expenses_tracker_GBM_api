import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { transactionService } from "./transaction.service";

const getTransactions = catchasync(async (req: Request, res: Response) => {
  const result = await transactionService.getTransactions(req.user!.id, req.query);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Transactions fetched successfully.",
    data: result.transactions,
    meta: result.meta,
  });
});

const createTransaction = catchasync(async (req: Request, res: Response) => {
  const transaction = await transactionService.createTransaction(
    req.user!.id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    status: 201,
    message: "Transaction created successfully.",
    data: transaction,
  });
});

const updateTransaction = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const transaction = await transactionService.updateTransaction(
    req.user!.id,
    id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Transaction updated successfully.",
    data: transaction,
  });
});

const deleteTransaction = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await transactionService.deleteTransaction(req.user!.id, id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Transaction deleted successfully.",
    data: null,
  });
});

const duplicateTransaction = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const transaction = await transactionService.duplicateTransaction(
    req.user!.id,
    id,
  );

  sendResponse(res, {
    success: true,
    status: 201,
    message: "Transaction duplicated successfully.",
    data: transaction,
  });
});

export const transactionController = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  duplicateTransaction,
};
