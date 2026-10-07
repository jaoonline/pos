"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/shared/submit-button";
import { adjustStockAction, addStockAction } from "@/actions/products";
import type { ActionState } from "@/actions/auth";

const initialState: ActionState = {};

function AddStockForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(addStockAction.bind(null, productId), initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      router.refresh();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.success, state.error, router]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="quantityToAdd">Quantity to add</Label>
        <Input id="quantityToAdd" name="quantityToAdd" type="number" min={1} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="addReason">Reason (optional)</Label>
        <Textarea id="addReason" name="reason" rows={2} placeholder="e.g. new delivery received" />
      </div>
      <SubmitButton pendingText="Adding..." size="sm">
        Add stock
      </SubmitButton>
    </form>
  );
}

function AdjustStockForm({ productId, currentStock }: { productId: string; currentStock: number }) {
  const router = useRouter();
  const [state, formAction] = useActionState(adjustStockAction.bind(null, productId), initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      router.refresh();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.success, state.error, router]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="newQuantity">New quantity</Label>
        <Input
          id="newQuantity"
          name="newQuantity"
          type="number"
          defaultValue={currentStock}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adjustReason">Reason</Label>
        <Textarea
          id="adjustReason"
          name="reason"
          rows={2}
          placeholder="e.g. stock count correction"
          required
        />
      </div>
      <SubmitButton pendingText="Updating..." size="sm">
        Set stock
      </SubmitButton>
    </form>
  );
}

export function StockCard({
  productId,
  currentStock,
  unit,
}: {
  productId: string;
  currentStock: number;
  unit: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-semibold">
          {currentStock} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
        <Tabs defaultValue="add">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add stock</TabsTrigger>
            <TabsTrigger value="adjust">Adjust stock</TabsTrigger>
          </TabsList>
          <TabsContent value="add" className="pt-3">
            <AddStockForm productId={productId} />
          </TabsContent>
          <TabsContent value="adjust" className="pt-3">
            <AdjustStockForm productId={productId} currentStock={currentStock} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
