import { toNumber } from "@/lib/money";
import type { Sale, SaleItem, Payment, Customer } from "@/generated/prisma/client";

export type ReceiptData = {
  id: string;
  receiptNumber: string;
  createdAt: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  salespersonName: string;
  customerName: string;
  items: { productName: string; sku: string; unitPrice: number; quantity: number; lineTotal: number }[];
  payment: { method: string; amountPaid: number; amountDue: number; changeAmount: number; reference: string | null } | null;
};

type SaleWithRelations = Sale & {
  items: SaleItem[];
  payment: Payment | null;
  customer: Customer | null;
  user: { fullName: string };
};

export function toReceiptData(sale: SaleWithRelations): ReceiptData {
  return {
    id: sale.id,
    receiptNumber: sale.receiptNumber,
    createdAt: sale.createdAt.toISOString(),
    status: sale.status,
    subtotal: toNumber(sale.subtotal),
    discountAmount: toNumber(sale.discountAmount),
    taxAmount: toNumber(sale.taxAmount),
    totalAmount: toNumber(sale.totalAmount),
    salespersonName: sale.user.fullName,
    customerName: sale.customer?.fullName ?? "Walk-in Customer",
    items: sale.items.map((item) => ({
      productName: item.productName,
      sku: item.sku,
      unitPrice: toNumber(item.unitPrice),
      quantity: item.quantity,
      lineTotal: toNumber(item.lineTotal),
    })),
    payment: sale.payment
      ? {
          method: sale.payment.method,
          amountPaid: toNumber(sale.payment.amountPaid),
          amountDue: toNumber(sale.payment.amountDue),
          changeAmount: toNumber(sale.payment.changeAmount),
          reference: sale.payment.reference,
        }
      : null,
  };
}
