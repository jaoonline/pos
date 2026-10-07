import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductInput } from "@/schemas/product";

export type ProductFilters = {
  search?: string;
  categoryId?: string;
  status?: "active" | "inactive" | "all";
  stock?: "low" | "out" | "all";
  page?: number;
  pageSize?: number;
};

export async function listProducts(filters: ProductFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const where: Prisma.ProductWhereInput = {
    isActive: filters.status === "all" || !filters.status ? undefined : filters.status === "active",
    categoryId: filters.categoryId || undefined,
    OR: filters.search
      ? [
          { name: { contains: filters.search, mode: "insensitive" } },
          { sku: { contains: filters.search, mode: "insensitive" } },
        ]
      : undefined,
  };

  if (filters.stock === "out") {
    where.stockQuantity = { lte: 0 };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const filtered = filters.stock === "low" ? items.filter((p) => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0) : items;

  return { items: filtered, total: filters.stock === "low" ? filtered.length : total, page, pageSize };
}

export async function searchSellableProducts(query: string, limit = 20) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: limit,
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id }, include: { category: true } });
}

export async function isSkuTaken(sku: string, excludeId?: string) {
  const existing = await prisma.product.findUnique({ where: { sku } });
  return Boolean(existing && existing.id !== excludeId);
}

export async function createProduct(data: ProductInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        minStockLevel: data.minStockLevel,
        unit: data.unit,
        imageUrl: data.imageUrl || null,
      },
    });

    if (data.stockQuantity > 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          userId,
          type: "INITIAL_STOCK",
          quantity: data.stockQuantity,
          previousStock: 0,
          newStock: data.stockQuantity,
          reason: "Initial stock on product creation",
        },
      });
    }

    return product;
  });
}

export async function updateProduct(id: string, data: ProductInput) {
  return prisma.product.update({
    where: { id },
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      minStockLevel: data.minStockLevel,
      unit: data.unit,
      imageUrl: data.imageUrl || null,
    },
  });
}

export async function setProductActive(id: string, isActive: boolean) {
  return prisma.product.update({ where: { id }, data: { isActive } });
}

export async function countActiveProducts() {
  return prisma.product.count({ where: { isActive: true } });
}
