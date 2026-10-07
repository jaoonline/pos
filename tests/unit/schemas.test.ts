import { describe, it, expect } from "vitest";
import { loginSchema, changePasswordSchema } from "@/schemas/auth";
import { productSchema } from "@/schemas/product";
import { checkoutSchema } from "@/schemas/sale";
import { customerSchema } from "@/schemas/customer";

describe("loginSchema", () => {
  it("rejects missing email/password", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("accepts valid credentials shape", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "secret" }).success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("rejects when new password is too short", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when confirmation does not match", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "newpassword1",
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching, long-enough passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "newpassword1",
      confirmPassword: "newpassword1",
    });
    expect(result.success).toBe(true);
  });
});

describe("productSchema", () => {
  const base = {
    sku: "SKU-1",
    name: "Test Product",
    categoryId: "cat_1",
    costPrice: 10,
    sellingPrice: 15,
    stockQuantity: 5,
    minStockLevel: 1,
    unit: "pcs",
  };

  it("rejects a zero or negative selling price", () => {
    expect(productSchema.safeParse({ ...base, sellingPrice: 0 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, sellingPrice: -5 }).success).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(productSchema.safeParse({ ...base, stockQuantity: -1 }).success).toBe(false);
  });

  it("accepts a valid product", () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });
});

describe("checkoutSchema", () => {
  it("rejects an empty cart", () => {
    const result = checkoutSchema.safeParse({
      items: [],
      paymentMethod: "CASH",
      amountPaid: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive quantity", () => {
    const result = checkoutSchema.safeParse({
      items: [{ productId: "p1", quantity: 0 }],
      paymentMethod: "CASH",
      amountPaid: 10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid cash checkout", () => {
    const result = checkoutSchema.safeParse({
      items: [{ productId: "p1", quantity: 2 }],
      paymentMethod: "CASH",
      amountPaid: 100,
    });
    expect(result.success).toBe(true);
  });
});

describe("customerSchema", () => {
  it("requires a full name", () => {
    expect(customerSchema.safeParse({ fullName: "" }).success).toBe(false);
  });

  it("allows a customer with only a name (phone/email optional)", () => {
    expect(customerSchema.safeParse({ fullName: "Jane Doe" }).success).toBe(true);
  });

  it("rejects an invalid email when provided", () => {
    expect(customerSchema.safeParse({ fullName: "Jane Doe", email: "not-an-email" }).success).toBe(false);
  });
});
