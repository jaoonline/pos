"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateShopSettingsAction } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ActionState } from "@/actions/auth";
import type { ShopSetting } from "@/generated/prisma/client";

const initialState: ActionState = {};

export function SettingsForm({ settings }: { settings: ShopSetting }) {
  const [state, formAction] = useActionState(updateShopSettingsAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shopName">Shop name</Label>
          <Input id="shopName" name="shopName" defaultValue={settings.shopName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Shop email</Label>
          <Input id="email" name="email" type="email" defaultValue={settings.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={settings.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={settings.address ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currencyCode">Currency code</Label>
          <Input
            id="currencyCode"
            name="currencyCode"
            placeholder="e.g. NGN"
            defaultValue={settings.currencyCode}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currencySymbol">Currency symbol</Label>
          <Input
            id="currencySymbol"
            name="currencySymbol"
            placeholder="e.g. ₦"
            defaultValue={settings.currencySymbol}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="receiptFooter">Receipt footer</Label>
          <Textarea
            id="receiptFooter"
            name="receiptFooter"
            rows={2}
            defaultValue={settings.receiptFooter ?? ""}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="allowNegativeStock">Allow negative stock</Label>
          <p className="text-sm text-muted-foreground">
            When enabled, sales can proceed even if a product&apos;s stock would go below zero.
          </p>
        </div>
        <Switch
          id="allowNegativeStock"
          name="allowNegativeStock"
          defaultChecked={settings.allowNegativeStock}
        />
      </div>

      {state.error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving...">Save Settings</SubmitButton>
      </div>
    </form>
  );
}
