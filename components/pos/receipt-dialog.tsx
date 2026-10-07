"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReceiptView } from "@/components/pos/receipt-view";
import { Printer } from "lucide-react";
import type { ReceiptData } from "@/lib/serialize";

export function ReceiptDialog({
  open,
  onOpenChange,
  receipt,
  shopName,
  shopAddress,
  shopPhone,
  receiptFooter,
  currencySymbol,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData | null;
  shopName: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  receiptFooter?: string | null;
  currencySymbol: string;
}) {
  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt {receipt.receiptNumber}</DialogTitle>
        </DialogHeader>
        <ReceiptView
          receipt={receipt}
          shopName={shopName}
          shopAddress={shopAddress}
          shopPhone={shopPhone}
          receiptFooter={receiptFooter}
          currencySymbol={currencySymbol}
        />
        <DialogFooter className="print:hidden">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
