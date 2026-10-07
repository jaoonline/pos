import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { completeSale, SaleValidationError } from "@/services/sales";
import { hashPassword } from "@/lib/password";

const RUN_ID = `${Date.now()}`;

let categoryId: string;
let userId: string;
let productId: string;
const createdSaleIds: string[] = [];

async function resetProductStock(stock: number) {
  await prisma.product.update({ where: { id: productId }, data: { stockQuantity: stock } });
}

beforeAll(async () => {
  const category = await prisma.category.create({
    data: { name: `Test Category ${RUN_ID}` },
  });
  categoryId = category.id;

  const user = await prisma.user.create({
    data: {
      fullName: "Test Runner",
      email: `test-runner-${RUN_ID}@example.com`,
      passwordHash: await hashPassword("irrelevant-for-this-test"),
      role: "SALESPERSON",
    },
  });
  userId = user.id;

  const product = await prisma.product.create({
    data: {
      sku: `TEST-SKU-${RUN_ID}`,
      name: "Test Widget",
      categoryId,
      costPrice: 50,
      sellingPrice: 100,
      stockQuantity: 10,
      minStockLevel: 2,
      unit: "pcs",
    },
  });
  productId = product.id;
});

afterAll(async () => {
  await prisma.inventoryMovement.deleteMany({ where: { productId } });
  if (createdSaleIds.length > 0) {
    await prisma.sale.deleteMany({ where: { id: { in: createdSaleIds } } });
  }
  await prisma.product.delete({ where: { id: productId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.user.delete({ where: { id: userId } });
});

beforeEach(async () => {
  await resetProductStock(10);
});

describe("completeSale", () => {
  it("completes a cash sale, deducts stock, and records a SALE inventory movement", async () => {
    const sale = await completeSale(
      {
        items: [{ productId, quantity: 3 }],
        discountAmount: 0,
        taxAmount: 0,
        paymentMethod: "CASH",
        amountPaid: 300,
      },
      userId
    );
    createdSaleIds.push(sale.id);

    expect(sale.status).toBe("COMPLETED");
    expect(Number(sale.totalAmount)).toBe(300);
    expect(sale.payment?.changeAmount ? Number(sale.payment.changeAmount) : 0).toBe(0);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stockQuantity).toBe(7);

    const movement = await prisma.inventoryMovement.findFirst({
      where: { saleId: sale.id, type: "SALE" },
    });
    expect(movement).not.toBeNull();
    expect(movement?.quantity).toBe(-3);
    expect(movement?.previousStock).toBe(10);
    expect(movement?.newStock).toBe(7);
  });

  it("calculates change correctly when cash paid exceeds the total", async () => {
    const sale = await completeSale(
      {
        items: [{ productId, quantity: 1 }],
        discountAmount: 0,
        taxAmount: 0,
        paymentMethod: "CASH",
        amountPaid: 150,
      },
      userId
    );
    createdSaleIds.push(sale.id);

    expect(Number(sale.totalAmount)).toBe(100);
    expect(sale.payment?.changeAmount ? Number(sale.payment.changeAmount) : NaN).toBe(50);
  });

  it("applies discount and tax to the total", async () => {
    const sale = await completeSale(
      {
        items: [{ productId, quantity: 2 }],
        discountAmount: 20,
        taxAmount: 10,
        paymentMethod: "CARD",
        amountPaid: 190,
      },
      userId
    );
    createdSaleIds.push(sale.id);

    expect(Number(sale.subtotal)).toBe(200);
    expect(Number(sale.totalAmount)).toBe(190);
  });

  it("rejects a sale when stock is insufficient and leaves stock unchanged", async () => {
    await expect(
      completeSale(
        {
          items: [{ productId, quantity: 1000 }],
          discountAmount: 0,
          taxAmount: 0,
          paymentMethod: "CASH",
          amountPaid: 100000,
        },
        userId
      )
    ).rejects.toBeInstanceOf(SaleValidationError);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stockQuantity).toBe(10);
  });

  it("rejects a sale when the amount paid is insufficient", async () => {
    await expect(
      completeSale(
        {
          items: [{ productId, quantity: 1 }],
          discountAmount: 0,
          taxAmount: 0,
          paymentMethod: "CASH",
          amountPaid: 50,
        },
        userId
      )
    ).rejects.toBeInstanceOf(SaleValidationError);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stockQuantity).toBe(10);
  });

  it("rejects a sale for an inactive product and leaves stock unchanged", async () => {
    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });

    await expect(
      completeSale(
        {
          items: [{ productId, quantity: 1 }],
          discountAmount: 0,
          taxAmount: 0,
          paymentMethod: "CASH",
          amountPaid: 100,
        },
        userId
      )
    ).rejects.toBeInstanceOf(SaleValidationError);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stockQuantity).toBe(10);

    await prisma.product.update({ where: { id: productId }, data: { isActive: true } });
  });

  it("generates unique, incrementing receipt numbers for sales on the same day", async () => {
    const saleA = await completeSale(
      { items: [{ productId, quantity: 1 }], discountAmount: 0, taxAmount: 0, paymentMethod: "CASH", amountPaid: 100 },
      userId
    );
    const saleB = await completeSale(
      { items: [{ productId, quantity: 1 }], discountAmount: 0, taxAmount: 0, paymentMethod: "CASH", amountPaid: 100 },
      userId
    );
    createdSaleIds.push(saleA.id, saleB.id);

    expect(saleA.receiptNumber).not.toBe(saleB.receiptNumber);
    expect(saleA.receiptNumber).toMatch(/^RCT-\d{8}-\d{4}$/);
    expect(saleB.receiptNumber).toMatch(/^RCT-\d{8}-\d{4}$/);

    const seqA = Number(saleA.receiptNumber.split("-")[2]);
    const seqB = Number(saleB.receiptNumber.split("-")[2]);
    expect(seqB).toBeGreaterThan(seqA);
  });

  it("rejects an empty cart via the transaction layer", async () => {
    await expect(
      completeSale(
        { items: [], discountAmount: 0, taxAmount: 0, paymentMethod: "CASH", amountPaid: 0 },
        userId
      )
    ).rejects.toBeTruthy();
  });
});
