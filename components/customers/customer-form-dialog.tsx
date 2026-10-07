"use client";

import { useActionState, useEffect, useId, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionState } from "@/actions/auth";

type CustomerFormValues = {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

const initialState: ActionState = {};

export function CustomerFormDialog({
  action,
  trigger,
  title,
  description,
  defaultValues,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  trigger: ReactNode;
  title: string;
  description?: string;
  defaultValues?: CustomerFormValues;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialState);
  const formId = useId();

  // Depend on the `state` object itself (a fresh reference every dispatch) rather than
  // `state.success` so repeated identical success messages still close the dialog + toast.
  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      // Closing the dialog is a UI response to a completed server action, not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-fullName`}>Full name</Label>
            <Input
              id={`${formId}-fullName`}
              name="fullName"
              defaultValue={defaultValues?.fullName ?? ""}
              maxLength={150}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-phone`}>Phone</Label>
            <Input
              id={`${formId}-phone`}
              name="phone"
              defaultValue={defaultValues?.phone ?? ""}
              maxLength={30}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              defaultValue={defaultValues?.email ?? ""}
              maxLength={150}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-address`}>Address</Label>
            <Textarea
              id={`${formId}-address`}
              name="address"
              defaultValue={defaultValues?.address ?? ""}
              maxLength={300}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-notes`}>Notes</Label>
            <Textarea
              id={`${formId}-notes`}
              name="notes"
              defaultValue={defaultValues?.notes ?? ""}
              maxLength={500}
              rows={2}
            />
          </div>
          {state.error && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingText="Saving...">Save</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
