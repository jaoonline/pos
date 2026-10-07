import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import * as productService from "@/services/products";
import * as inventoryService from "@/services/inventory";

const RUN_ID = `${Date.now()}`;

let categoryId: string;
let userId: string;
let productId: string;

beforeAll(async () => {
  const category = await prisma.category.create({ data: { name: `Inventory Test ${RUN_ID}` } });
  categoryId = category.id;

  const user = await prisma.user.create({
    data: {
      fullName: "Inventory Tester",
      email: `inventory-tester-${RUN_ID}@example.com`,
      passwordHash: "irrelevant",
      role: "ADMINISTRATOR",
    },
  });
  userId = user.id;

  const product = await prisma.product.create({
    data: {
      sku: `INV-TEST-${RUN_ID}`,
      name: "Inventory Test Product",
      categoryId,
      costPrice: 10,
      sellingPrice: 20,
      stockQuantity: 5,
      minStockLevel: 10,
      unit: "pcs",
    },
  });
  productId = product.id;
});

afterAll(async () => {
  await prisma.inventoryMovement.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("isSkuTaken", () => {
  it("detects a duplicate SKU", async () => {
    expect(await productService.isSkuTaken(`INV-TEST-${RUN_ID}`)).toBe(true);
  });

  it("excludes the product's own id when checking for edits", async () => {
    expect(await productService.isSkuTaken(`INV-TEST-${RUN_ID}`, productId)).toBe(false);
  });
});

describe("addStock", () => {
  it("increases stock and records a STOCK_ADDITION movement with correct before/after values", async () => {
    const movement = await inventoryService.addStock({
      productId,
      userId,
      quantityToAdd: 15,
      reason: "Restock",
    });

    expect(movement.type).toBe("STOCK_ADDITION");
    expect(movement.previousStock).toBe(5);
    expect(movement.newStock).toBe(20);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stockQuantity).toBe(20);
  });
});

describe("setAbsoluteStock", () => {
  it("sets stock to an exact value and records the delta", async () => {
    const movement = await inventoryService.setAbsoluteStock({
      productId,
      userId,
      newQuantity: 8,
      reason: "Stock count correction",
    });

    expect(movement.previousStock).toBe(20);
    expect(movement.newStock).toBe(8);
    expect(movement.quantity).toBe(-12);
  });

  it("rejects a negative quantity when allowNegativeStock is off", async () => {
    await prisma.shopSetting.upsert({
      where: { id: 1 },
      update: { allowNegativeStock: false },
      create: { id: 1, allowNegativeStock: false },
    });

    await expect(
      inventoryService.setAbsoluteStock({ productId, userId, newQuantity: -5 })
    ).rejects.toThrow(inventoryService.InsufficientStockError);
  });
});

describe("getLowStockProducts", () => {
  it("includes a product whose stock is at or below its minimum level", async () => {
    await prisma.product.update({ where: { id: productId }, data: { stockQuantity: 3, minStockLevel: 10 } });
    const lowStock = await inventoryService.getLowStockProducts();
    expect(lowStock.some((p) => p.id === productId)).toBe(true);
  });

  it("excludes a product whose stock is above its minimum level", async () => {
    await prisma.product.update({ where: { id: productId }, data: { stockQuantity: 50, minStockLevel: 10 } });
    const lowStock = await inventoryService.getLowStockProducts();
    expect(lowStock.some((p) => p.id === productId)).toBe(false);
  });
});
