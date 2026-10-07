"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSalespersonSchema, updateSalespersonSchema, resetPasswordSchema } from "@/schemas/user";
import * as userService from "@/services/users";
import { logAction } from "@/services/audit";
import type { ActionState } from "@/actions/auth";

export async function createSalespersonAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser(["ADMINISTRATOR"]);

    const parsed = createSalespersonSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (await userService.isEmailTaken(parsed.data.email)) {
      return { error: "A user with this email already exists." };
    }

    const created = await userService.createSalesperson(parsed.data);
    await logAction({
      userId: user.id,
      action: "SALESPERSON_CREATED",
      entityType: "User",
      entityId: created.id,
      details: { email: created.email, fullName: created.fullName },
    });

    revalidatePath("/salespersons");
    return { success: "Salesperson created." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateSalespersonAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser(["ADMINISTRATOR"]);

    const existing = await userService.getSalespersonById(id);
    if (!existing) {
      return { error: "Salesperson not found." };
    }

    const parsed = updateSalespersonSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (await userService.isEmailTaken(parsed.data.email, id)) {
      return { error: "A user with this email already exists." };
    }

    await userService.updateSalesperson(id, parsed.data);
    await logAction({
      userId: user.id,
      action: "SALESPERSON_UPDATED",
      entityType: "User",
      entityId: id,
      details: { email: parsed.data.email, fullName: parsed.data.fullName },
    });

    revalidatePath("/salespersons");
    revalidatePath(`/salespersons/${id}`);
    return { success: "Salesperson updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function setSalespersonActiveAction(id: string, isActive: boolean) {
  const user = await requireUser(["ADMINISTRATOR"]);

  const existing = await userService.getSalespersonById(id);
  if (!existing) {
    throw new Error("Salesperson not found.");
  }

  await userService.setSalespersonActive(id, isActive);
  await logAction({
    userId: user.id,
    action: isActive ? "SALESPERSON_ACTIVATED" : "SALESPERSON_DEACTIVATED",
    entityType: "User",
    entityId: id,
  });

  revalidatePath("/salespersons");
  revalidatePath(`/salespersons/${id}`);
}

export async function resetSalespersonPasswordAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireUser(["ADMINISTRATOR"]);

    const existing = await userService.getSalespersonById(id);
    if (!existing) {
      return { error: "Salesperson not found." };
    }

    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    await userService.resetSalespersonPassword(id, parsed.data.newPassword);
    await logAction({
      userId: user.id,
      action: "SALESPERSON_PASSWORD_RESET",
      entityType: "User",
      entityId: id,
    });

    revalidatePath(`/salespersons/${id}`);
    return { success: "Password reset successfully." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
