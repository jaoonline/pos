"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { shopSettingsSchema } from "@/schemas/settings";
import { updateShopSettings } from "@/services/settings";
import { logAction } from "@/services/audit";
import type { ActionState } from "@/actions/auth";

export async function updateShopSettingsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser(["ADMINISTRATOR"]);

    const parsed = shopSettingsSchema.safeParse({
      shopName: formData.get("shopName"),
      address: formData.get("address"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      receiptFooter: formData.get("receiptFooter"),
      currencyCode: formData.get("currencyCode"),
      currencySymbol: formData.get("currencySymbol"),
      allowNegativeStock: formData.get("allowNegativeStock") === "on",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const settings = await updateShopSettings({
      shopName: parsed.data.shopName,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      receiptFooter: parsed.data.receiptFooter || null,
      currencyCode: parsed.data.currencyCode,
      currencySymbol: parsed.data.currencySymbol,
      allowNegativeStock: parsed.data.allowNegativeStock,
    });

    await logAction({
      userId: user.id,
      action: "SETTINGS_UPDATED",
      entityType: "ShopSetting",
      entityId: String(settings.id),
      details: { shopName: settings.shopName },
    });

    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: "Settings updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
