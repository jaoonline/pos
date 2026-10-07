import "server-only";
import { prisma } from "@/lib/prisma";
import { getShopSettings } from "@/services/settings";
import type { InventoryMovementType, Prisma } from "@/generated/prisma/client";

export class InsufficientStockError extends Error {}

export async function setAbsoluteStock(params: {
  productId: string;
  userId: string;
  newQuantity: number;
  reason?: string;
  type?: InventoryMovementType;
}) {
  const { productId, userId, newQuantity, reason } = params;
  const type = params.type ?? "ADJUSTMENT";

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const settings = await getShopSettings();

    if (newQuantity < 0 && !settings.allowNegativeStock) {
      throw new InsufficientStockError("Stock quantity cannot be negative.");
    }

    const previousStock = product.stockQuantity;
    const delta = newQuantity - previousStock;

    await tx.product.update({ where: { id: productId }, data: { stockQuantity: newQuantity } });

    return tx.inventoryMovement.create({
      data: {
        productId,
        userId,
        type,
        quantity: delta,
        previousStock,
        newStock: newQuantity,
        reason,
      },
    });
  });
}

export async function addStock(params: {
  productId: string;
  userId: string;
  quantityToAdd: number;
  reason?: string;
}) {
  const { productId, userId, quantityToAdd, reason } = params;
  if (quantityToAdd <= 0) {
    throw new Error("Quantity to add must be greater than zero.");
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantityToAdd;

    await tx.product.update({ where: { id: productId }, data: { stockQuantity: newStock } });

    return tx.inventoryMovement.create({
      data: {
        productId,
        userId,
        type: "STOCK_ADDITION",
        quantity: quantityToAdd,
        previousStock,
        newStock,
        reason,
      },
    });
  });
}

export async function listMovements(filters?: {
  productId?: string;
  type?: InventoryMovementType;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;

  const where: Prisma.InventoryMovementWhereInput = {
    productId: filters?.productId,
    type: filters?.type,
    createdAt:
      filters?.from || filters?.to
        ? { gte: filters?.from, lte: filters?.to }
        : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: { product: { select: { name: true, sku: true } }, user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getLowStockProducts(limit?: number) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { stockQuantity: "asc" },
    take: limit,
  });
  return products.filter((p) => p.stockQuantity <= p.minStockLevel);
}

export async function getOutOfStockProducts() {
  return prisma.product.findMany({
    where: { isActive: true, stockQuantity: { lte: 0 } },
    orderBy: { name: "asc" },
  });
}
