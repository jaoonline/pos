"use client";

import { toast } from "sonner";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { setProductActiveAction } from "@/actions/products";

export function ProductActivationButton({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  return (
    <ConfirmActionButton
      title={isActive ? "Deactivate product?" : "Activate product?"}
      description={
        isActive
          ? "This product will no longer be available for sale until it is reactivated."
          : "This product will become available for sale again."
      }
      confirmLabel={isActive ? "Deactivate" : "Activate"}
      triggerLabel={isActive ? "Deactivate" : "Activate"}
      variant={isActive ? "destructive" : "default"}
      onConfirm={async () => {
        await setProductActiveAction(productId, !isActive);
        toast.success(isActive ? "Product deactivated." : "Product activated.");
      }}
    />
  );
}
