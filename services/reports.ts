import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardStats() {
  const today = startOfDay(new Date());

  const [todaysAgg, totalProducts, lowStockProducts, totalCustomers, activeSalespersons] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: today }, status: "COMPLETED" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({ where: { isActive: true }, select: { stockQuantity: true, minStockLevel: true } }),
      prisma.customer.count(),
      prisma.user.count({ where: { role: "SALESPERSON", isActive: true } }),
    ]);

  const lowStockCount = lowStockProducts.filter((p) => p.stockQuantity <= p.minStockLevel).length;

  return {
    todaysSales: toNumber(todaysAgg._sum.totalAmount ?? 0),
    todaysTransactions: todaysAgg._count,
    totalProducts,
    lowStockCount,
    totalCustomers,
    activeSalespersons,
  };
}

export async function getRecentSales(limit = 8) {
  return prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      customer: { select: { fullName: true } },
      user: { select: { fullName: true } },
    },
  });
}

export async function getSalesTrend(days = 14) {
  const from = startOfDay(new Date());
  from.setDate(from.getDate() - (days - 1));

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: from }, status: "COMPLETED" },
    select: { createdAt: true, totalAmount: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const sale of sales) {
    const key = sale.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + toNumber(sale.totalAmount));
  }

  return Array.from(buckets.entries()).map(([date, total]) => ({ date, total }));
}

export async function getTopSellingProducts(params: { from?: Date; to?: Date; limit?: number } = {}) {
  const grouped = await prisma.saleItem.groupBy({
    by: ["productId", "productName", "sku"],
    where: {
      sale: {
        status: "COMPLETED",
        createdAt: params.from || params.to ? { gte: params.from, lte: params.to } : undefined,
      },
    },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: params.limit ?? 10,
  });

  return grouped.map((g) => ({
    productId: g.productId,
    name: g.productName,
    sku: g.sku,
    quantitySold: g._sum.quantity ?? 0,
    revenue: toNumber(g._sum.lineTotal ?? 0),
  }));
}

export async function getSalesBySalesperson(params: { from?: Date; to?: Date } = {}) {
  const grouped = await prisma.sale.groupBy({
    by: ["userId"],
    where: {
      status: "COMPLETED",
      createdAt: params.from || params.to ? { gte: params.from, lte: params.to } : undefined,
    },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, fullName: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.fullName]));

  return grouped.map((g) => ({
    userId: g.userId,
    fullName: userMap.get(g.userId) ?? "Unknown",
    totalSales: toNumber(g._sum.totalAmount ?? 0),
    transactionCount: g._count,
  }));
}

export async function getSalesByPaymentMethod(params: { from?: Date; to?: Date } = {}) {
  const grouped = await prisma.payment.groupBy({
    by: ["method"],
    where: {
      sale: {
        status: "COMPLETED",
        createdAt: params.from || params.to ? { gte: params.from, lte: params.to } : undefined,
      },
    },
    _sum: { amountPaid: true },
    _count: true,
  });

  return grouped.map((g) => ({
    method: g.method,
    total: toNumber(g._sum.amountPaid ?? 0),
    count: g._count,
  }));
}

export async function getSalesReportSummary(params: { from: Date; to: Date }) {
  const aggregate = await prisma.sale.aggregate({
    where: { createdAt: { gte: params.from, lte: params.to }, status: "COMPLETED" },
    _sum: { totalAmount: true },
    _count: true,
  });

  const totalSales = toNumber(aggregate._sum.totalAmount ?? 0);
  const transactionCount = aggregate._count;

  return {
    totalSales,
    transactionCount,
    averageTransactionValue: transactionCount > 0 ? totalSales / transactionCount : 0,
  };
}

export async function getSalesInRange(params: { from: Date; to: Date }) {
  return prisma.sale.findMany({
    where: { createdAt: { gte: params.from, lte: params.to } },
    include: {
      customer: { select: { fullName: true } },
      user: { select: { fullName: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTopCustomers(limit = 10) {
  const grouped = await prisma.sale.groupBy({
    by: ["customerId"],
    where: { status: "COMPLETED", customerId: { not: null } },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
    take: limit,
  });

  const customers = await prisma.customer.findMany({
    where: { id: { in: grouped.map((g) => g.customerId).filter((id): id is string => Boolean(id)) } },
    select: { id: true, fullName: true },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c.fullName]));

  return grouped.map((g) => ({
    customerId: g.customerId!,
    fullName: customerMap.get(g.customerId!) ?? "Unknown",
    totalSpent: toNumber(g._sum.totalAmount ?? 0),
    purchaseCount: g._count,
  }));
}
