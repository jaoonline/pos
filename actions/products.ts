"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { productSchema, stockAdjustmentSchema, stockAdditionSchema } from "@/schemas/product";
import * as productService from "@/services/products";
import * as inventoryService from "@/services/inventory";
import { logAction } from "@/services/audit";
import { toNumber } from "@/lib/money";
import type { ActionState } from "@/actions/auth";
import type { SellableProduct } from "@/lib/types";

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser(["ADMINISTRATOR"]);

    const parsed = productSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (await productService.isSkuTaken(parsed.data.sku)) {
      return { error: "A product with this SKU already exists." };
    }

    const product = await productService.createProduct(parsed.data, user.id);
    await logAction({
      userId: user.id,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
      details: { sku: product.sku, name: product.name },
    });

    revalidatePath("/products");
    revalidatePath("/inventory");
    return { success: "Product created." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateProductAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser(["ADMINISTRATOR"]);

    const parsed = productSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (await productService.isSkuTaken(parsed.data.sku, id)) {
      return { error: "A product with this SKU already exists." };
    }

    await productService.updateProduct(id, parsed.data);
    await logAction({
      userId: user.id,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: id,
      details: { sku: parsed.data.sku, name: parsed.data.name },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return { success: "Product updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function setProductActiveAction(id: string, isActive: boolean) {
  const user = await requireUser(["ADMINISTRATOR"]);
  await productService.setProductActive(id, isActive);
  await logAction({
    userId: user.id,
    action: isActive ? "PRODUCT_ACTIVATED" : "PRODUCT_DEACTIVATED",
    entityType: "Product",
    entityId: id,
  });
  revalidatePath("/products");
}

export async function adjustStockAction(
  productId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser(["ADMINISTRATOR"]);

    const parsed = stockAdjustmentSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const movement = await inventoryService.setAbsoluteStock({
      productId,
      userId: user.id,
      newQuantity: parsed.data.newQuantity,
      reason: parsed.data.reason,
    });

    await logAction({
      userId: user.id,
      action: "STOCK_ADJUSTED",
      entityType: "Product",
      entityId: productId,
      details: { newQuantity: parsed.data.newQuantity, reason: parsed.data.reason },
    });

    revalidatePath("/products");
    revalidatePath("/inventory");
    return { success: `Stock updated to ${movement.newStock}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function addStockAction(
  productId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser(["ADMINISTRATOR"]);

    const parsed = stockAdditionSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const movement = await inventoryService.addStock({
      productId,
      userId: user.id,
      quantityToAdd: parsed.data.quantityToAdd,
      reason: parsed.data.reason || "Stock addition",
    });

    await logAction({
      userId: user.id,
      action: "STOCK_ADDED",
      entityType: "Product",
      entityId: productId,
      details: { quantityAdded: parsed.data.quantityToAdd },
    });

    revalidatePath("/products");
    revalidatePath("/inventory");
    return { success: `Stock increased to ${movement.newStock}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function searchProductsAction(query: string): Promise<SellableProduct[]> {
  await requireUser();
  const products = await productService.searchSellableProducts(query);
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    sellingPrice: toNumber(p.sellingPrice),
    stockQuantity: p.stockQuantity,
    unit: p.unit,
  }));
}
