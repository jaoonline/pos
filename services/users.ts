import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import type { Prisma } from "@/generated/prisma/client";

const SAFE_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type SalespersonFilters = {
  search?: string;
  status?: "active" | "inactive" | "all";
  page?: number;
  pageSize?: number;
};

export async function listSalespersons(filters: SalespersonFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const where: Prisma.UserWhereInput = {
    role: "SALESPERSON",
    isActive: filters.status === "all" || !filters.status ? undefined : filters.status === "active",
    OR: filters.search
      ? [
          { fullName: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ]
      : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { ...SAFE_USER_SELECT, _count: { select: { sales: true } } },
      orderBy: { fullName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getSalespersonById(id: string) {
  return prisma.user.findFirst({
    where: { id, role: "SALESPERSON" },
    select: { ...SAFE_USER_SELECT, _count: { select: { sales: true } } },
  });
}

export async function isEmailTaken(email: string, excludeId?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  return Boolean(existing && existing.id !== excludeId);
}

export async function createSalesperson(data: { fullName: string; email: string; password: string }) {
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      role: "SALESPERSON",
      isActive: true,
    },
    select: SAFE_USER_SELECT,
  });
}

export async function updateSalesperson(id: string, data: { fullName: string; email: string }) {
  return prisma.user.update({
    where: { id },
    data: { fullName: data.fullName, email: data.email },
    select: SAFE_USER_SELECT,
  });
}

export async function setSalespersonActive(id: string, isActive: boolean) {
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: SAFE_USER_SELECT,
  });
}

export async function resetSalespersonPassword(id: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: SAFE_USER_SELECT,
  });
}
