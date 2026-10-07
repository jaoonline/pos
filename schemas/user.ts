import { z } from "zod";

export const createSalespersonSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(150),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateSalespersonInput = z.infer<typeof createSalespersonSchema>;

export const updateSalespersonSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(150),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

export type UpdateSalespersonInput = z.infer<typeof updateSalespersonSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
