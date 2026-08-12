import { Request, Response } from "express";
import { catchasync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { quickAddService } from "./quick-add.service";

const getQuickAdds = catchasync(async (req: Request, res: Response) => {
  const presets = await quickAddService.getQuickAdds(req.user!.id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Quick-add presets fetched successfully.",
    data: presets,
  });
});

const createQuickAdd = catchasync(async (req: Request, res: Response) => {
  const preset = await quickAddService.createQuickAdd(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    status: 201,
    message: "Quick-add preset created successfully.",
    data: preset,
  });
});

const updateQuickAdd = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const preset = await quickAddService.updateQuickAdd(req.user!.id, id, req.body);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Quick-add preset updated successfully.",
    data: preset,
  });
});

const deleteQuickAdd = catchasync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await quickAddService.deleteQuickAdd(req.user!.id, id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Quick-add preset deleted successfully.",
    data: null,
  });
});

const seedDefaults = catchasync(async (req: Request, res: Response) => {
  await quickAddService.seedDefaults(req.user!.id);
  const presets = await quickAddService.getQuickAdds(req.user!.id);

  sendResponse(res, {
    success: true,
    status: 200,
    message: "Default quick-add presets seeded successfully.",
    data: presets,
  });
});

export const quickAddController = {
  getQuickAdds,
  createQuickAdd,
  updateQuickAdd,
  deleteQuickAdd,
  seedDefaults,
};
