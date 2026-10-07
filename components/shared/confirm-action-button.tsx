"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ComponentProps } from "react";

export function ConfirmActionButton({
  title,
  description,
  confirmLabel = "Confirm",
  variant,
  triggerVariant = "outline",
  triggerLabel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerLabel: React.ReactNode;
  onConfirm: () => Promise<void> | void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className={variant === "destructive" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                try {
                  await onConfirm();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Action failed");
                }
              });
            }}
          >
            {isPending ? "Please wait..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
