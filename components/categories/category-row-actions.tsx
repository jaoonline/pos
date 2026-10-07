"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { CategoryForm } from "@/components/categories/category-form";
import { updateCategoryAction, setCategoryActiveAction } from "@/actions/categories";

export function CategoryRowActions({
  category,
}: {
  category: { id: string; name: string; description: string | null; isActive: boolean };
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            action={updateCategoryAction.bind(null, category.id)}
            category={category}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmActionButton
        title={category.isActive ? "Deactivate category?" : "Activate category?"}
        description={
          category.isActive
            ? `Products in "${category.name}" will keep this category, but it will be hidden from selection on new products.`
            : `"${category.name}" will be available again when creating or editing products.`
        }
        confirmLabel={category.isActive ? "Deactivate" : "Activate"}
        triggerLabel={category.isActive ? "Deactivate" : "Activate"}
        variant={category.isActive ? "destructive" : "default"}
        onConfirm={async () => {
          await setCategoryActiveAction(category.id, !category.isActive);
          toast.success(category.isActive ? "Category deactivated." : "Category activated.");
        }}
      />
    </div>
  );
}
