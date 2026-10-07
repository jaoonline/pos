"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartList } from "@/components/pos/cart-list";
import { CustomerPicker } from "@/components/pos/customer-picker";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import { checkoutAction } from "@/actions/sales";
import { getReceiptAction } from "@/actions/receipts";
import { formatMoney, round2 } from "@/lib/money";
import type { CartLine, CustomerOption, SellableProduct } from "@/lib/types";
import type { ReceiptData } from "@/lib/serialize";

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD";

export function PosScreen({
  initialProducts,
  currencySymbol,
  shopName,
  shopAddress,
  shopPhone,
  receiptFooter,
}: {
  initialProducts: SellableProduct[];
  currencySymbol: string;
  shopName: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  receiptFooter?: string | null;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashTendered, setCashTendered] = useState(0);
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmitting, startSubmit] = useTransition();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const subtotal = useMemo(
    () => round2(cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)),
    [cart]
  );
  const total = useMemo(
    () => round2(subtotal - discountAmount + taxAmount),
    [subtotal, discountAmount, taxAmount]
  );
  const amountPaid = paymentMethod === "CASH" ? (cashTendered > 0 ? cashTendered : total) : total;
  const change = paymentMethod === "CASH" ? Math.max(0, round2(amountPaid - total)) : 0;

  function addToCart(product: SellableProduct) {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.warning(`Only ${product.stockQuantity} ${product.unit} of "${product.name}" available.`);
          return prev;
        }
        return prev.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      if (product.stockQuantity <= 0) {
        toast.warning(`"${product.name}" is out of stock.`);
        return prev;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.sellingPrice,
          quantity: 1,
          availableStock: product.stockQuantity,
          unit: product.unit,
        },
      ];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((line) => line.productId !== productId);
      return prev.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.min(quantity, line.availableStock) }
          : line
      );
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  function resetForNewSale() {
    setCart([]);
    setCustomer(null);
    setDiscountAmount(0);
    setTaxAmount(0);
    setPaymentMethod("CASH");
    setCashTendered(0);
    setPaymentReference("");
  }

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }
    if (amountPaid < total) {
      toast.error("Amount paid is less than the total due.");
      return;
    }

    startSubmit(async () => {
      const result = await checkoutAction({
        customerId: customer?.id ?? null,
        items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        discountAmount,
        taxAmount,
        paymentMethod,
        amountPaid,
        paymentReference,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Sale completed: ${result.receiptNumber}`);
      const receiptData = await getReceiptAction(result.saleId);
      setReceipt(receiptData);
      setReceiptOpen(true);
      resetForNewSale();
    });
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      <Card className="flex min-h-0 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
          <ProductGrid initialProducts={initialProducts} currencySymbol={currencySymbol} onAdd={addToCart} />
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-4">
          <CustomerPicker value={customer} onChange={setCustomer} />

          <CartList
            cart={cart}
            currencySymbol={currencySymbol}
            onQuantityChange={updateQuantity}
            onRemove={removeFromCart}
          />

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(subtotal, currencySymbol)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="discount" className="text-muted-foreground">Discount</Label>
              <Input
                id="discount"
                type="number"
                min={0}
                step="0.01"
                className="h-8 w-28 text-right"
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="tax" className="text-muted-foreground">Tax</Label>
              <Input
                id="tax"
                type="number"
                min={0}
                step="0.01"
                className="h-8 w-28 text-right"
                value={taxAmount || ""}
                onChange={(e) => setTaxAmount(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(total, currencySymbol)}</span>
            </div>
          </div>

          <Separator />

          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="CASH">Cash</TabsTrigger>
              <TabsTrigger value="BANK_TRANSFER">Transfer</TabsTrigger>
              <TabsTrigger value="CARD">Card</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount paid</Label>
            <Input
              id="amountPaid"
              type="number"
              min={0}
              step="0.01"
              disabled={paymentMethod !== "CASH"}
              value={amountPaid || ""}
              onChange={(e) => setCashTendered(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          {paymentMethod !== "CASH" && (
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (optional)</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction reference"
              />
            </div>
          )}

          {paymentMethod === "CASH" && (
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Change</span>
              <span>{formatMoney(change, currencySymbol)}</span>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={isSubmitting || cart.length === 0}
            onClick={handleCheckout}
          >
            {isSubmitting ? "Processing..." : `Complete Sale ${formatMoney(total, currencySymbol)}`}
          </Button>
        </CardContent>
      </Card>

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receipt}
        shopName={shopName}
        shopAddress={shopAddress}
        shopPhone={shopPhone}
        receiptFooter={receiptFooter}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
