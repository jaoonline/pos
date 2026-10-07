"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { getCurrentUser, homeRouteForRole, requireUser } from "@/lib/auth";
import { authenticateUser } from "@/services/auth";
import { isRateLimited, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema, changePasswordSchema } from "@/schemas/auth";

export type ActionState = { error?: string; success?: string };

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;
  const rateLimitKey = email.toLowerCase();

  if (isRateLimited(rateLimitKey)) {
    return { error: "Too many login attempts. Please try again in a few minutes." };
  }

  const result = await authenticateUser(email, password);
  if (!result.success) {
    return { error: result.error };
  }
  const { user } = result;

  resetRateLimit(rateLimitKey);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession({
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  });

  redirect(homeRouteForRole(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changeOwnPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const valid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { success: "Password updated successfully." };
}

export async function getCurrentUserOrNull() {
  return getCurrentUser();
}
