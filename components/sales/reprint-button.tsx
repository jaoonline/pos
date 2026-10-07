"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { getReceiptAction } from "@/actions/receipts";
import type { ReceiptData } from "@/lib/serialize";
import type { ComponentProps } from "react";

/**
 * Fetches the receipt for a sale (via getReceiptAction, which enforces that a
 * salesperson can only reprint their own sales) and shows it in the shared
 * ReceiptDialog with a Print button.
 */
export function ReprintButton({
  saleId,
  shopName,
  shopAddress,
  shopPhone,
  receiptFooter,
  currencySymbol,
  variant = "outline",
  size = "sm",
  label = "Reprint",
}: {
  saleId: string;
  shopName: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  receiptFooter?: string | null;
  currencySymbol: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  label?: string;
}) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const data = await getReceiptAction(saleId);
        setReceipt(data);
        setOpen(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load receipt.");
      }
    });
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={handleClick} disabled={isPending}>
        <Printer className="mr-2 h-4 w-4" />
        {isPending ? "Loading..." : label}
      </Button>
      <ReceiptDialog
        open={open}
        onOpenChange={setOpen}
        receipt={receipt}
        shopName={shopName}
        shopAddress={shopAddress}
        shopPhone={shopPhone}
        receiptFooter={receiptFooter}
        currencySymbol={currencySymbol}
      />
    </>
  );
}
