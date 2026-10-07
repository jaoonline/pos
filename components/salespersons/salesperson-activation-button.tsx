"use client";

import { toast } from "sonner";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { setSalespersonActiveAction } from "@/actions/users";

export function SalespersonActivationButton({
  salespersonId,
  isActive,
}: {
  salespersonId: string;
  isActive: boolean;
}) {
  return (
    <ConfirmActionButton
      title={isActive ? "Deactivate salesperson?" : "Activate salesperson?"}
      description={
        isActive
          ? "This salesperson will no longer be able to sign in until reactivated."
          : "This salesperson will be able to sign in again."
      }
      confirmLabel={isActive ? "Deactivate" : "Activate"}
      triggerLabel={isActive ? "Deactivate" : "Activate"}
      variant={isActive ? "destructive" : "default"}
      onConfirm={async () => {
        await setSalespersonActiveAction(salespersonId, !isActive);
        toast.success(isActive ? "Salesperson deactivated." : "Salesperson activated.");
      }}
    />
  );
}
