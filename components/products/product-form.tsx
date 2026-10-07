"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { toNumber } from "@/lib/money";
import type { ActionState } from "@/actions/auth";
import type { Product } from "@/generated/prisma/client";

const initialState: ActionState = {};

export function ProductForm({
  action,
  categories,
  product,
  submitLabel = "Save Product",
  hideInitialStock = false,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  categories: { id: string; name: string }[];
  product?: Product;
  submitLabel?: string;
  hideInitialStock?: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      router.push("/products");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product name</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select name="categoryId" defaultValue={product?.categoryId}>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            name="unit"
            placeholder="e.g. pcs, kg, pack"
            defaultValue={product?.unit}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPrice">Cost price</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            step="0.01"
            min={0}
            defaultValue={product ? toNumber(product.costPrice) : undefined}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling price</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            step="0.01"
            min={0}
            defaultValue={product ? toNumber(product.sellingPrice) : undefined}
            required
          />
        </div>
        {hideInitialStock ? (
          <input type="hidden" name="stockQuantity" value={product?.stockQuantity ?? 0} />
        ) : (
          <div className="space-y-2">
            <Label htmlFor="stockQuantity">Initial stock</Label>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min={0}
              defaultValue={0}
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="minStockLevel">Minimum stock level</Label>
          <Input
            id="minStockLevel"
            name="minStockLevel"
            type="number"
            min={0}
            defaultValue={product?.minStockLevel ?? 0}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="imageUrl">Image URL (optional)</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={product?.imageUrl ?? ""}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/products")}>
          Cancel
        </Button>
        <SubmitButton pendingText="Saving...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
