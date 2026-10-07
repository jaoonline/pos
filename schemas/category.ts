import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CategoryInput = z.infer<typeof categorySchema>;
