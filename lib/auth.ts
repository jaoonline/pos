import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
};

/** Re-checks the DB on every call so a deactivated account loses access immediately, not just on next login. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, fullName: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
}

export function homeRouteForRole(role: Role) {
  return role === "ADMINISTRATOR" ? "/admin" : "/pos";
}

/** For Server Components / pages: redirects instead of throwing. */
export async function requireUserForPage(allowedRoles?: Role[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(homeRouteForRole(user.role));
  }
  return user;
}

export class AuthError extends Error {}

/** For Server Actions / route handlers: throws so callers can return a form-friendly error. */
export async function requireUser(allowedRoles?: Role[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You must be logged in to do this.");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AuthError("You do not have permission to do this.");
  }
  return user;
}
