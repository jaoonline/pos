import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero"),
});

export const checkoutSchema = z.object({
  customerId: z.string().min(1).optional().nullable(),
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  discountAmount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  taxAmount: z.coerce.number().min(0, "Tax cannot be negative").default(0),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD"]),
  amountPaid: z.coerce.number().min(0, "Amount paid cannot be negative"),
  paymentReference: z.string().trim().max(100).optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
