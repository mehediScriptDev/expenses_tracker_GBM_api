import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { loanService } from "./loan.service";

const getLoans = catchasync(async (req: Request, res: Response) => {
  const result = await loanService.getLoans(req.user!.id, req.query);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Loans fetched successfully.",
    data: result.loans,
    meta: result.meta,
  });
});

const createLoan = catchasync(async (req: Request, res: Response) => {
  const loan = await loanService.createLoan(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    status: 201,
    message: "Loan created successfully.",
    data: loan,
  });
});

const updateLoan = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const loan = await loanService.updateLoan(req.user!.id, id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Loan updated successfully.",
    data: loan,
  });
});

const repayLoan = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const loan = await loanService.repayLoan(req.user!.id, id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Loan repayment recorded successfully.",
    data: loan,
  });
});

const deleteLoan = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await loanService.deleteLoan(req.user!.id, id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Loan deleted successfully.",
    data: null,
  });
});

export const loanController = {
  getLoans,
  createLoan,
  updateLoan,
  repayLoan,
  deleteLoan,
};
