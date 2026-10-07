"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { customerSchema } from "@/schemas/customer";
import * as customerService from "@/services/customers";
import type { ActionState } from "@/actions/auth";

export async function createCustomerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireUser();

    const parsed = customerSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (parsed.data.phone && (await customerService.isPhoneTaken(parsed.data.phone))) {
      return { error: "A customer with this phone number already exists." };
    }

    await customerService.createCustomer(parsed.data);
    revalidatePath("/customers");
    return { success: "Customer created." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateCustomerAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireUser(["ADMINISTRATOR"]);

    const parsed = customerSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (parsed.data.phone && (await customerService.isPhoneTaken(parsed.data.phone, id))) {
      return { error: "A customer with this phone number already exists." };
    }

    await customerService.updateCustomer(id, parsed.data);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { success: "Customer updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function searchCustomersAction(query: string) {
  await requireUser();
  return customerService.searchCustomers(query);
}

export async function quickCreateCustomerAction(data: {
  fullName: string;
  phone?: string;
}) {
  await requireUser();
  const parsed = customerSchema.safeParse({ fullName: data.fullName, phone: data.phone ?? "" });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  if (parsed.data.phone && (await customerService.isPhoneTaken(parsed.data.phone))) {
    throw new Error("A customer with this phone number already exists.");
  }
  return customerService.createCustomer(parsed.data);
}
