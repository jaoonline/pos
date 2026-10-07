import { z } from "zod";

export const shopSettingsSchema = z.object({
  shopName: z.string().trim().min(1, "Shop name is required").max(150),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  receiptFooter: z.string().trim().max(300).optional().or(z.literal("")),
  currencyCode: z.string().trim().min(1, "Currency code is required").max(10),
  currencySymbol: z.string().trim().min(1, "Currency symbol is required").max(10),
  allowNegativeStock: z.boolean(),
});

export type ShopSettingsFormInput = z.infer<typeof shopSettingsSchema>;
