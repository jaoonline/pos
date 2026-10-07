import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { getSalesInRange, getTopSellingProducts, getTopCustomers } from "@/services/reports";
import { listProducts } from "@/services/products";
import { listMovements } from "@/services/inventory";
import { toNumber } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    await requireUser(["ADMINISTRATOR"]);
  } catch (error) {
    const status = error instanceof AuthError ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") ?? "sales";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(new Date().getDate() - 30));
  const to = toParam ? new Date(new Date(toParam).setHours(23, 59, 59, 999)) : new Date();

  let csv: string;
  let filename: string;

  switch (type) {
    case "products": {
      const { items } = await listProducts({ status: "all", pageSize: 1000 });
      csv = toCsv(
        items.map((p) => ({
          sku: p.sku,
          name: p.name,
          category: p.category.name,
          costPrice: toNumber(p.costPrice),
          sellingPrice: toNumber(p.sellingPrice),
          stock: p.stockQuantity,
          minStock: p.minStockLevel,
          status: p.isActive ? "Active" : "Inactive",
        })),
        [
          { key: "sku", label: "SKU" },
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "costPrice", label: "Cost Price" },
          { key: "sellingPrice", label: "Selling Price" },
          { key: "stock", label: "Stock" },
          { key: "minStock", label: "Min Stock" },
          { key: "status", label: "Status" },
        ]
      );
      filename = "products-report.csv";
      break;
    }
    case "customers": {
      const topCustomers = await getTopCustomers(1000);
      csv = toCsv(
        topCustomers.map((c) => ({
          name: c.fullName,
          purchaseCount: c.purchaseCount,
          totalSpent: c.totalSpent,
        })),
        [
          { key: "name", label: "Customer" },
          { key: "purchaseCount", label: "Purchases" },
          { key: "totalSpent", label: "Total Spent" },
        ]
      );
      filename = "customers-report.csv";
      break;
    }
    case "inventory": {
      const { items } = await listMovements({ from, to, pageSize: 5000 });
      csv = toCsv(
        items.map((m) => ({
          date: m.createdAt.toISOString(),
          product: m.product.name,
          sku: m.product.sku,
          type: m.type,
          quantity: m.quantity,
          previousStock: m.previousStock,
          newStock: m.newStock,
          reason: m.reason ?? "",
          user: m.user.fullName,
        })),
        [
          { key: "date", label: "Date" },
          { key: "product", label: "Product" },
          { key: "sku", label: "SKU" },
          { key: "type", label: "Type" },
          { key: "quantity", label: "Quantity" },
          { key: "previousStock", label: "Previous Stock" },
          { key: "newStock", label: "New Stock" },
          { key: "reason", label: "Reason" },
          { key: "user", label: "User" },
        ]
      );
      filename = "inventory-report.csv";
      break;
    }
    case "top-products": {
      const topProducts = await getTopSellingProducts({ from, to, limit: 1000 });
      csv = toCsv(
        topProducts.map((p) => ({ name: p.name, sku: p.sku, quantitySold: p.quantitySold, revenue: p.revenue })),
        [
          { key: "name", label: "Product" },
          { key: "sku", label: "SKU" },
          { key: "quantitySold", label: "Quantity Sold" },
          { key: "revenue", label: "Revenue" },
        ]
      );
      filename = "top-products-report.csv";
      break;
    }
    case "sales":
    default: {
      const sales = await getSalesInRange({ from, to });
      csv = toCsv(
        sales.map((s) => ({
          receiptNumber: s.receiptNumber,
          date: s.createdAt.toISOString(),
          customer: s.customer?.fullName ?? "Walk-in Customer",
          salesperson: s.user.fullName,
          subtotal: toNumber(s.subtotal),
          discount: toNumber(s.discountAmount),
          tax: toNumber(s.taxAmount),
          total: toNumber(s.totalAmount),
          paymentMethod: s.payment?.method ?? "",
          status: s.status,
        })),
        [
          { key: "receiptNumber", label: "Receipt Number" },
          { key: "date", label: "Date" },
          { key: "customer", label: "Customer" },
          { key: "salesperson", label: "Salesperson" },
          { key: "subtotal", label: "Subtotal" },
          { key: "discount", label: "Discount" },
          { key: "tax", label: "Tax" },
          { key: "total", label: "Total" },
          { key: "paymentMethod", label: "Payment Method" },
          { key: "status", label: "Status" },
        ]
      );
      filename = "sales-report.csv";
      break;
    }
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
