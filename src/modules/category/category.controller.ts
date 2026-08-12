import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryService } from "./category.service";

const getCategories = catchasync(async (req: Request, res: Response) => {
  const result = await categoryService.getCategories(req.user!.id, req.query);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Categories fetched successfully.",
    data: result.categories,
    meta: result.meta,
  });
});

const createCategory = catchasync(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    status: 201,
    message: "Category created successfully.",
    data: category,
  });
});

const updateCategory = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await categoryService.updateCategory(
    req.user!.id,
    id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Category updated successfully.",
    data: category,
  });
});

const deleteCategory = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await categoryService.deleteCategory(req.user!.id, id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Category deleted successfully.",
    data: null,
  });
});

const seedDefaults = catchasync(async (req: Request, res: Response) => {
  await categoryService.seedDefaults(req.user!.id);
  const result = await categoryService.getCategories(req.user!.id, {
    limit: 100,
  });

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Default categories seeded successfully.",
    data: result.categories,
    meta: result.meta,
  });
});

export const categoryController = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaults,
};
