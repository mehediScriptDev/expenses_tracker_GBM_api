import { prisma } from "../../lib/prisma";
import { CategoryKind } from "../../../generated/prisma/enums";
import { ICreateCategory, IUpdateCategory } from "./category.types";

const DEFAULT_CATEGORIES = [
  { system_key: "food", name: "Food", icon: "utensils", color: "var(--chart-2)", kind: CategoryKind.EXPENSE },
  { system_key: "rent", name: "Rent", icon: "house", color: "var(--chart-4)", kind: CategoryKind.EXPENSE },
  { system_key: "transport", name: "Transport", icon: "bus", color: "var(--chart-3)", kind: CategoryKind.EXPENSE },
  {
    system_key: "personal-care",
    name: "Personal Care",
    icon: "shopping-bag",
    color: "var(--chart-5)",
    kind: CategoryKind.EXPENSE,
  },
  { system_key: "other", name: "Other", icon: "ellipsis", color: "var(--chart-4)", kind: CategoryKind.EXPENSE },
  { system_key: "salary", name: "Salary", icon: "wallet", color: "var(--chart-5)", kind: CategoryKind.INCOME },
];

const formatCategory = (category: any) => {
  return {
    ...category,
    kind: category.kind.toLowerCase(),
  };
};

const getCategories = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = {
    user_id: userId,
  };

  if (query.kind && query.kind !== "all") {
    where.kind = query.kind.toUpperCase();
  }

  if (query.search) {
    where.name = {
      contains: query.search,
      mode: "insensitive",
    };
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.category.count({ where }),
  ]);

  return {
    categories: categories.map(formatCategory),
    meta: {
      page,
      limit,
      total,
    },
  };
};

const createCategory = async (userId: string, payload: ICreateCategory) => {
  if (!payload.name?.trim()) {
    throw new Error("Category name is required.");
  }

  const category = await prisma.category.create({
    data: {
      user_id: userId,
      name: payload.name.trim(),
      kind: payload.kind.toUpperCase() as CategoryKind,
      icon: payload.icon,
      color: payload.color,
      is_custom: true,
    },
  });

  return formatCategory(category);
};

const updateCategory = async (
  userId: string,
  id: string,
  payload: IUpdateCategory,
) => {
  const existing = await prisma.category.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Category not found.");
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: payload.name?.trim() ?? existing.name,
      kind: payload.kind
        ? (payload.kind.toUpperCase() as CategoryKind)
        : existing.kind,
      icon: payload.icon ?? existing.icon,
      color: payload.color ?? existing.color,
    },
  });

  return formatCategory(category);
};

const deleteCategory = async (userId: string, id: string) => {
  const existing = await prisma.category.findFirst({
    where: { id, user_id: userId },
  });

  if (!existing) {
    throw new Error("Category not found.");
  }

  const otherCategory = await prisma.category.findFirst({
    where: {
      user_id: userId,
      system_key: "other",
    },
  });

  if (!otherCategory) {
    throw new Error("Default other category not found.");
  }

  if (existing.id === otherCategory.id) {
    throw new Error("Cannot delete the other category.");
  }

  await prisma.transaction.updateMany({
    where: {
      user_id: userId,
      category_id: id,
    },
    data: {
      category_id: otherCategory.id,
    },
  });

  await prisma.budget.deleteMany({
    where: {
      user_id: userId,
      category_id: id,
    },
  });

  await prisma.category.delete({
    where: { id },
  });
};

const seedDefaults = async (userId: string) => {
  const count = await prisma.category.count({
    where: { user_id: userId },
  });

  if (count > 0) {
    return;
  }

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({
      user_id: userId,
      name: category.name,
      icon: category.icon,
      color: category.color,
      kind: category.kind,
      is_custom: false,
      system_key: category.system_key,
    })),
  });
};

export const categoryService = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaults,
};
