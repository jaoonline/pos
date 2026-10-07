import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(50),
  name: z.string().trim().min(1, "Product name is required").max(150),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative"),
  sellingPrice: z.coerce.number().gt(0, "Selling price must be greater than zero"),
  stockQuantity: z.coerce.number().int().min(0, "Initial stock cannot be negative"),
  minStockLevel: z.coerce.number().int().min(0, "Minimum stock level cannot be negative"),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  imageUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;

export const stockAdjustmentSchema = z.object({
  newQuantity: z.coerce.number().int("Quantity must be a whole number"),
  reason: z.string().trim().min(1, "Please provide a reason for this adjustment").max(300),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const stockAdditionSchema = z.object({
  quantityToAdd: z.coerce.number().int().positive("Quantity must be greater than zero"),
  reason: z.string().trim().max(300).optional().or(z.literal("")),
});

export type StockAdditionInput = z.infer<typeof stockAdditionSchema>;
