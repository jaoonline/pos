import Link from "next/link";
import { requireUserForPage } from "@/lib/auth";
import { listSales, type SaleFilters } from "@/services/sales";
import { getShopSettings } from "@/services/settings";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { ReprintButton } from "@/components/sales/reprint-button";
import type { PaymentMethod, SaleStatus } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "CARD"];
const STATUSES: SaleStatus[] = ["COMPLETED", "CANCELLED", "REFUNDED"];

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card / POS",
};

function statusVariant(status: SaleStatus): "default" | "destructive" | "outline" {
  if (status === "CANCELLED") return "destructive";
  if (status === "REFUNDED") return "outline";
  return "default";
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    from?: string;
    to?: string;
    paymentMethod?: string;
    status?: string;
    salesperson?: string;
    page?: string;
  }>;
}) {
  const user = await requireUserForPage();
  const params = await searchParams;

  const search = params.search ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";
  const paymentMethod = params.paymentMethod ?? "";
  const status = params.status ?? "";
  const salesperson = params.salesperson ?? "";
  const page = Number(params.page) || 1;

  const isAdmin = user.role === "ADMINISTRATOR";

  const [{ items: sales, total }, settings, salespeople] = await Promise.all([
    listSales({
      search: search || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(`${to}T23:59:59.999`) : undefined,
      paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : undefined,
      status: status ? (status as SaleStatus) : undefined,
      // Defense in depth: a salesperson always sees only their own sales,
      // regardless of any salesperson= query param they might tamper with.
      userId: isAdmin ? salesperson || undefined : user.id,
      page,
      pageSize: PAGE_SIZE,
    } satisfies SaleFilters),
    getShopSettings(),
    isAdmin
      ? prisma.user.findMany({
          where: { role: "SALESPERSON" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const activeSearchParams = { search, from, to, paymentMethod, status, salesperson };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">{isAdmin ? "Sales" : "My Sales"}</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Browse and filter every completed, cancelled and refunded sale."
            : "Browse your own sales history."}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="col-span-2 space-y-1 sm:col-span-1">
              <label className="text-xs text-muted-foreground" htmlFor="search">
                Receipt #
              </label>
              <Input id="search" name="search" placeholder="RCT-..." defaultValue={search} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="from">
                From
              </label>
              <Input id="from" name="from" type="date" defaultValue={from} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="to">
                To
              </label>
              <Input id="to" name="to" type="date" defaultValue={to} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="paymentMethod">
                Payment method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                defaultValue={paymentMethod}
                className={selectClassName}
              >
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABEL[method]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="status">
                Status
              </label>
              <select id="status" name="status" defaultValue={status} className={selectClassName}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="salesperson">
                  Salesperson
                </label>
                <select
                  id="salesperson"
                  name="salesperson"
                  defaultValue={salesperson}
                  className={selectClassName}
                >
                  <option value="">All salespeople</option>
                  {salespeople.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
              <Button type="submit" variant="outline" className="w-full">
                Filter
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link href="/sales" title="Clear filters">
                  &times;
                </Link>
              </Button>
            </div>
          </form>

          {sales.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  {isAdmin && <TableHead>Salesperson</TableHead>}
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.receiptNumber}</TableCell>
                    <TableCell>{sale.createdAt.toLocaleString()}</TableCell>
                    <TableCell>{sale.customer?.fullName ?? "Walk-in Customer"}</TableCell>
                    {isAdmin && <TableCell>{sale.user.fullName}</TableCell>}
                    <TableCell className="text-right">{sale._count.items}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(sale.totalAmount, settings.currencySymbol)}
                    </TableCell>
                    <TableCell>
                      {sale.payment ? PAYMENT_METHOD_LABEL[sale.payment.method] : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(sale.status)}>{sale.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/sales/${sale.id}`}>View</Link>
                        </Button>
                        <ReprintButton
                          saleId={sale.id}
                          shopName={settings.shopName}
                          shopAddress={settings.address}
                          shopPhone={settings.phone}
                          receiptFooter={settings.receiptFooter}
                          currencySymbol={settings.currencySymbol}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/sales"
            searchParams={activeSearchParams}
          />
        </CardContent>
      </Card>
    </div>
  );
}
