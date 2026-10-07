"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { checkoutSchema, type CheckoutInput } from "@/schemas/sale";
import { completeSale, SaleValidationError } from "@/services/sales";
import { logAction } from "@/services/audit";

export type CheckoutResult =
  | { success: true; saleId: string; receiptNumber: string }
  | { success: false; error: string };

export async function checkoutAction(input: CheckoutInput): Promise<CheckoutResult> {
  try {
    const user = await requireUser(["ADMINISTRATOR", "SALESPERSON"]);

    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid checkout data." };
    }

    const sale = await completeSale(parsed.data, user.id);

    await logAction({
      userId: user.id,
      action: "SALE_COMPLETED",
      entityType: "Sale",
      entityId: sale.id,
      details: { receiptNumber: sale.receiptNumber, totalAmount: sale.totalAmount.toString() },
    });

    revalidatePath("/sales");
    revalidatePath("/pos");
    revalidatePath("/inventory");
    revalidatePath("/admin");

    return { success: true, saleId: sale.id, receiptNumber: sale.receiptNumber };
  } catch (error) {
    if (error instanceof SaleValidationError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete sale.",
    };
  }
}
