"use server";

import { requireUser } from "@/lib/auth";
import { getSaleById } from "@/services/sales";
import { toReceiptData } from "@/lib/serialize";

export async function getReceiptAction(saleId: string) {
  const user = await requireUser();
  const sale = await getSaleById(saleId);
  if (!sale) throw new Error("Sale not found.");

  if (user.role === "SALESPERSON" && sale.userId !== user.id) {
    throw new Error("You can only view receipts for your own sales.");
  }

  return toReceiptData(sale);
}
