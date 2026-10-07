import "server-only";
import { prisma } from "@/lib/prisma";
import type { CategoryInput } from "@/schemas/category";

export async function listCategories(options?: { includeInactive?: boolean }) {
  return prisma.category.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export async function createCategory(data: CategoryInput) {
  return prisma.category.create({
    data: { name: data.name, description: data.description || null },
  });
}

export async function updateCategory(id: string, data: CategoryInput) {
  return prisma.category.update({
    where: { id },
    data: { name: data.name, description: data.description || null },
  });
}

export async function setCategoryActive(id: string, isActive: boolean) {
  return prisma.category.update({ where: { id }, data: { isActive } });
}

export async function isCategoryNameTaken(name: string, excludeId?: string) {
  const existing = await prisma.category.findUnique({ where: { name } });
  return Boolean(existing && existing.id !== excludeId);
}
