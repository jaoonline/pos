import "server-only";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { User } from "@/generated/prisma/client";

export type AuthenticateResult =
  | { success: true; user: User }
  | { success: false; error: string };

/** Pure credential check — no session/cookie side effects, so it's easy to unit test. */
export async function authenticateUser(email: string, password: string): Promise<AuthenticateResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { success: false, error: "Invalid email or password." };
  }

  if (!user.isActive) {
    return { success: false, error: "This account has been deactivated. Contact your administrator." };
  }

  return { success: true, user };
}
