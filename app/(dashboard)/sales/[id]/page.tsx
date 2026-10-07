import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUserForPage } from "@/lib/auth";
import { getSaleById } from "@/services/sales";
import { getShopSettings } from "@/services/settings";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReprintButton } from "@/components/sales/reprint-button";
import type { SaleStatus } from "@/generated/prisma/client";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card / POS",
};

function statusVariant(status: SaleStatus): "default" | "destructive" | "outline" {
  if (status === "CANCELLED") return "destructive";
  if (status === "REFUNDED") return "outline";
  return "default";
}

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUserForPage();
  const { id } = await params;

  const sale = await getSaleById(id);

  // Treat "belongs to someone else" exactly like "doesn't exist" — a
  // salesperson must not be able to confirm another sale's existence by
  // guessing/enumerating URLs.
  if (!sale || (user.role !== "ADMINISTRATOR" && sale.userId !== user.id)) {
    notFound();
  }

  const settings = await getShopSettings();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-xl font-semibold">Sale {sale.receiptNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {sale.createdAt.toLocaleString()}
            </p>
          </div>
        </div>
        <ReprintButton
          saleId={sale.id}
          shopName={settings.shopName}
          shopAddress={settings.address}
          shopPhone={settings.phone}
          receiptFooter={settings.receiptFooter}
          currencySymbol={settings.currencySymbol}
          variant="default"
          size="default"
          label="Print / Reprint Receipt"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.unitPrice, settings.currencySymbol)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(item.lineTotal, settings.currencySymbol)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(sale.subtotal, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatMoney(sale.discountAmount, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(sale.taxAmount, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(sale.totalAmount, settings.currencySymbol)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusVariant(sale.status)}>{sale.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salesperson</span>
                <span>{sale.user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span>{sale.customer?.fullName ?? "Walk-in Customer"}</span>
              </div>
              {sale.customer?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{sale.customer.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sale.payment ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span>{PAYMENT_METHOD_LABEL[sale.payment.method] ?? sale.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount paid</span>
                    <span>{formatMoney(sale.payment.amountPaid, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount due</span>
                    <span>{formatMoney(sale.payment.amountDue, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change</span>
                    <span>{formatMoney(sale.payment.changeAmount, settings.currencySymbol)}</span>
                  </div>
                  {sale.payment.reference && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference</span>
                      <span>{sale.payment.reference}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No payment record.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
