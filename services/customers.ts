import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { CustomerInput } from "@/schemas/customer";

export async function listCustomers(filters?: { search?: string; page?: number; pageSize?: number }) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const where: Prisma.CustomerWhereInput = filters?.search
    ? {
        OR: [
          { fullName: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { sales: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function searchCustomers(query: string, limit = 10) {
  if (!query.trim()) return [];
  return prisma.customer.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { fullName: "asc" },
    take: limit,
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({ where: { id } });
}

export async function getCustomerPurchaseHistory(customerId: string, page = 1, pageSize = 20) {
  const [sales, total, aggregate] = await Promise.all([
    prisma.sale.findMany({
      where: { customerId },
      include: { items: true, payment: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sale.count({ where: { customerId } }),
    prisma.sale.aggregate({
      where: { customerId, status: "COMPLETED" },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  return {
    sales,
    total,
    page,
    pageSize,
    totalSpent: aggregate._sum.totalAmount ?? 0,
    purchaseCount: aggregate._count,
  };
}

export async function isPhoneTaken(phone: string, excludeId?: string) {
  if (!phone) return false;
  const existing = await prisma.customer.findUnique({ where: { phone } });
  return Boolean(existing && existing.id !== excludeId);
}

export async function createCustomer(data: CustomerInput) {
  return prisma.customer.create({
    data: {
      fullName: data.fullName,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  });
}

export async function updateCustomer(id: string, data: CustomerInput) {
  return prisma.customer.update({
    where: { id },
    data: {
      fullName: data.fullName,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  });
}

export async function countCustomers() {
  return prisma.customer.count();
}
