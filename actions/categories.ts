"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { categorySchema } from "@/schemas/category";
import * as categoryService from "@/services/categories";
import type { ActionState } from "@/actions/auth";

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireUser(["ADMINISTRATOR"]);

    const parsed = categorySchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (await categoryService.isCategoryNameTaken(parsed.data.name)) {
      return { error: "A category with this name already exists." };
    }

    await categoryService.createCategory(parsed.data);
    revalidatePath("/categories");
    return { success: "Category created." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateCategoryAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireUser(["ADMINISTRATOR"]);

    const parsed = categorySchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (await categoryService.isCategoryNameTaken(parsed.data.name, id)) {
      return { error: "A category with this name already exists." };
    }

    await categoryService.updateCategory(id, parsed.data);
    revalidatePath("/categories");
    return { success: "Category updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function setCategoryActiveAction(id: string, isActive: boolean) {
  await requireUser(["ADMINISTRATOR"]);
  await categoryService.setCategoryActive(id, isActive);
  revalidatePath("/categories");
  revalidatePath("/products");
}
