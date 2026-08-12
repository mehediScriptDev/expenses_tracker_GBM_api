import { prisma } from "../../lib/prisma";
import { PaymentMethod } from "../../../generated/prisma/enums";
import { ICreateQuickAdd, IUpdateQuickAdd } from "./quick-add.types";

const DEFAULT_PRESETS = [
  {
    label: "Vat",
    icon: "coffee",
    amount: 40,
    category_system_key: "food",
    payment_method: PaymentMethod.CASH,
    sort_order: 0,
  },
  {
    label: "Bus",
    icon: "bus",
    amount: 80,
    category_system_key: "transport",
    payment_method: PaymentMethod.CASH,
    sort_order: 1,
  }
];

const withCategory = {
  category: {
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      kind: true,
    },
  },
};

const formatPreset = (preset: any) => {
  return {
    ...preset,
    payment_method: preset.payment_method.toLowerCase(),
    category: preset.category
      ? {
          ...preset.category,
          kind: preset.category.kind.toLowerCase(),
        }
      : null,
  };
};

const getQuickAdds = async (userId: string) => {
  const presets = await prisma.quickAddPreset.findMany({
    where: { user_id: userId },
    include: withCategory,
    orderBy: { sort_order: "asc" },
  });

  return presets.map(formatPreset);
};

const createQuickAdd = async (userId: string, payload: ICreateQuickAdd) => {
  if (!payload.label?.trim()) {
    throw new Error("Label is required.");
  }

  const amount = Math.round(payload.amount);

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const category = await prisma.category.findFirst({
    where: {
      id: payload.category_id,
      user_id: userId,
    },
  });

  if (!category) {
    throw new Error("Category not found.");
  }

  const preset = await prisma.quickAddPreset.create({
    data: {
      user_id: userId,
      label: payload.label.trim(),
      icon: payload.icon,
      amount,
      category_id: payload.category_id,
      payment_method: payload.payment_method.toUpperCase() as PaymentMethod,
      sort_order: payload.sort_order ?? 0,
    },
    include: withCategory,
  });

  return formatPreset(preset);
};

const updateQuickAdd = async (
  userId: string,
  id: string,
  payload: IUpdateQuickAdd,
) => {
  const existing = await prisma.quickAddPreset.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Quick-add preset not found.");
  }

  if (payload.category_id) {
    const category = await prisma.category.findFirst({
      where: {
        id: payload.category_id,
        user_id: userId,
      },
    });

    if (!category) {
      throw new Error("Category not found.");
    }
  }

  const amount =
    payload.amount !== undefined ? Math.round(payload.amount) : existing.amount;

  if (!amount || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const preset = await prisma.quickAddPreset.update({
    where: { id },
    data: {
      label: payload.label?.trim() ?? existing.label,
      icon: payload.icon ?? existing.icon,
      amount,
      category_id: payload.category_id ?? existing.category_id,
      payment_method: payload.payment_method
        ? (payload.payment_method.toUpperCase() as PaymentMethod)
        : existing.payment_method,
      sort_order: payload.sort_order ?? existing.sort_order,
    },
    include: withCategory,
  });

  return formatPreset(preset);
};

const deleteQuickAdd = async (userId: string, id: string) => {
  const existing = await prisma.quickAddPreset.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Quick-add preset not found.");
  }

  await prisma.quickAddPreset.delete({
    where: { id },
  });
};

const seedDefaults = async (userId: string) => {
  const count = await prisma.quickAddPreset.count({
    where: { user_id: userId },
  });

  if (count > 0) {
    return;
  }

  const categories = await prisma.category.findMany({
    where: { user_id: userId },
    select: { id: true, system_key: true },
  });

  const categoryByKey = categories.reduce(
    (acc, category) => {
      if (category.system_key) {
        acc[category.system_key] = category.id;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const data = DEFAULT_PRESETS.flatMap((preset) => {
    const categoryId = categoryByKey[preset.category_system_key];

    if (!categoryId) {
      return [];
    }

    return [
      {
        user_id: userId,
        label: preset.label,
        icon: preset.icon,
        amount: preset.amount,
        category_id: categoryId,
        payment_method: preset.payment_method,
        sort_order: preset.sort_order,
      },
    ];
  });

  if (data.length === 0) {
    return;
  }

  await prisma.quickAddPreset.createMany({ data });
};

export const quickAddService = {
  getQuickAdds,
  createQuickAdd,
  updateQuickAdd,
  deleteQuickAdd,
  seedDefaults,
};
