"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import type { CartLine } from "@/lib/types";

export function CartList({
  cart,
  currencySymbol,
  onQuantityChange,
  onRemove,
}: {
  cart: CartLine[];
  currencySymbol: string;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
        Cart is empty. Search and select products to add them here.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto">
      {cart.map((line) => (
        <div key={line.productId} className="flex items-center gap-2 rounded-md border p-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{line.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(line.unitPrice, currencySymbol)} &times; {line.quantity}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onQuantityChange(line.productId, line.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm">{line.quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={line.quantity >= line.availableStock}
              onClick={() => onQuantityChange(line.productId, line.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <span className="w-20 text-right text-sm font-semibold">
            {formatMoney(line.unitPrice * line.quantity, currencySymbol)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onRemove(line.productId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
