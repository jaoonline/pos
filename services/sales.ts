import "server-only";
import { prisma } from "@/lib/prisma";
import { getShopSettings } from "@/services/settings";
import { round2 } from "@/lib/money";
import type { CheckoutInput } from "@/schemas/sale";
import type { Prisma, SaleStatus } from "@/generated/prisma/client";

export class SaleValidationError extends Error {}

function todayPrefix() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `RCT-${y}${m}${d}`;
}

async function generateReceiptNumber(tx: Prisma.TransactionClient): Promise<string> {
  const prefix = todayPrefix();
  const countToday = await tx.sale.count({
    where: { receiptNumber: { startsWith: prefix } },
  });
  const sequence = String(countToday + 1).padStart(4, "0");
  return `${prefix}-${sequence}`;
}

export async function completeSale(input: CheckoutInput, userId: string) {
  if (input.items.length === 0) {
    throw new SaleValidationError("Cart cannot be empty.");
  }

  const settings = await getShopSettings();

  const MAX_ATTEMPTS = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const productIds = input.items.map((item) => item.productId);
        const products = await tx.product.findMany({ where: { id: { in: productIds } } });
        const productMap = new Map(products.map((p) => [p.id, p]));

        let subtotal = 0;
        const lineItems: {
          productId: string;
          productName: string;
          sku: string;
          unitPrice: number;
          quantity: number;
          lineTotal: number;
        }[] = [];

        for (const item of input.items) {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new SaleValidationError("One of the products in the cart no longer exists.");
          }
          if (!product.isActive) {
            throw new SaleValidationError(`"${product.name}" is no longer available for sale.`);
          }

          const unitPrice = Number(product.sellingPrice);
          const lineTotal = round2(unitPrice * item.quantity);
          subtotal = round2(subtotal + lineTotal);

          lineItems.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unitPrice,
            quantity: item.quantity,
            lineTotal,
          });

          const updateResult = await tx.product.updateMany({
            where: settings.allowNegativeStock
              ? { id: product.id, isActive: true }
              : { id: product.id, isActive: true, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });

          if (updateResult.count !== 1) {
            throw new SaleValidationError(
              `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, requested: ${item.quantity}.`
            );
          }
        }

        if (input.discountAmount > subtotal) {
          throw new SaleValidationError("Discount cannot exceed the cart subtotal.");
        }

        const totalAmount = round2(subtotal - input.discountAmount + input.taxAmount);

        if (input.amountPaid < totalAmount) {
          throw new SaleValidationError(
            `Amount paid (${input.amountPaid}) is less than the total due (${totalAmount}).`
          );
        }

        const changeAmount =
          input.paymentMethod === "CASH" ? round2(input.amountPaid - totalAmount) : 0;

        const receiptNumber = await generateReceiptNumber(tx);

        const sale = await tx.sale.create({
          data: {
            receiptNumber,
            customerId: input.customerId || null,
            userId,
            subtotal,
            discountAmount: input.discountAmount,
            taxAmount: input.taxAmount,
            totalAmount,
            status: "COMPLETED" as SaleStatus,
            items: {
              create: lineItems,
            },
            payment: {
              create: {
                method: input.paymentMethod,
                amountPaid: input.amountPaid,
                amountDue: totalAmount,
                changeAmount,
                reference: input.paymentReference || null,
              },
            },
          },
          include: {
            items: true,
            payment: true,
            customer: true,
            user: { select: { fullName: true } },
          },
        });

        for (const item of lineItems) {
          const currentProduct = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
          const newStock = currentProduct.stockQuantity;
          const previousStock = newStock + item.quantity;

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              saleId: sale.id,
              userId,
              type: "SALE",
              quantity: -item.quantity,
              previousStock,
              newStock,
              reason: `Sale ${sale.receiptNumber}`,
            },
          });
        }

        return sale;
      });
    } catch (error) {
      lastError = error;
      const isUniqueReceiptClash =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";

      if (isUniqueReceiptClash && attempt < MAX_ATTEMPTS - 1) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export type SaleFilters = {
  userId?: string;
  customerId?: string;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "CARD";
  status?: SaleStatus;
  from?: Date;
  to?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listSales(filters: SaleFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const where: Prisma.SaleWhereInput = {
    userId: filters.userId,
    customerId: filters.customerId,
    status: filters.status,
    createdAt:
      filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined,
    payment: filters.paymentMethod ? { method: filters.paymentMethod } : undefined,
    receiptNumber: filters.search ? { contains: filters.search, mode: "insensitive" } : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { fullName: true } },
        user: { select: { fullName: true } },
        payment: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
      payment: true,
      customer: true,
      user: { select: { fullName: true, email: true } },
    },
  });
}

export async function getTodaysSalesSummary(userId?: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const aggregate = await prisma.sale.aggregate({
    where: {
      createdAt: { gte: startOfDay },
      status: "COMPLETED",
      userId,
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  return {
    totalSales: aggregate._sum.totalAmount ?? 0,
    transactionCount: aggregate._count,
  };
}
