import Link from "next/link";
import { requireUserForPage } from "@/lib/auth";
import {
  getSalesReportSummary,
  getSalesByPaymentMethod,
  getSalesBySalesperson,
  getTopSellingProducts,
  getTopCustomers,
} from "@/services/reports";
import { getLowStockProducts, getOutOfStockProducts, listMovements } from "@/services/inventory";
import { countActiveProducts } from "@/services/products";
import { countCustomers } from "@/services/customers";
import { getShopSettings } from "@/services/settings";
import { formatMoney } from "@/lib/money";
import { ReportTabs } from "@/components/dashboard/report-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  await requireUserForPage(["ADMINISTRATOR"]);
  const params = await searchParams;

  const tab = typeof params.tab === "string" ? params.tab : "sales";
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  const fromStr = typeof params.from === "string" ? params.from : toDateInput(defaultFrom);
  const toStr = typeof params.to === "string" ? params.to : toDateInput(new Date());

  const from = new Date(fromStr);
  const to = new Date(new Date(toStr).setHours(23, 59, 59, 999));

  const settings = await getShopSettings();
  const currencySymbol = settings.currencySymbol;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Sales, product, customer and inventory insights.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportTabs active={tab} from={fromStr} to={toStr} />
        <form className="flex items-end gap-2" method="get">
          <input type="hidden" name="tab" value={tab} />
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">From</label>
            <input
              type="date"
              name="from"
              defaultValue={fromStr}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">To</label>
            <input
              type="date"
              name="to"
              defaultValue={toStr}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
        </form>
      </div>

      {tab === "sales" && (
        <SalesReport from={from} to={to} fromStr={fromStr} toStr={toStr} currencySymbol={currencySymbol} />
      )}
      {tab === "products" && (
        <ProductsReport from={from} to={to} fromStr={fromStr} toStr={toStr} currencySymbol={currencySymbol} />
      )}
      {tab === "customers" && <CustomersReport currencySymbol={currencySymbol} />}
      {tab === "inventory" && <InventoryReport from={from} to={to} fromStr={fromStr} toStr={toStr} />}
    </div>
  );
}

function ExportButton({ href }: { href: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Link>
    </Button>
  );
}

async function SalesReport({
  from,
  to,
  fromStr,
  toStr,
  currencySymbol,
}: {
  from: Date;
  to: Date;
  fromStr: string;
  toStr: string;
  currencySymbol: string;
}) {
  const [summary, byPaymentMethod, bySalesperson] = await Promise.all([
    getSalesReportSummary({ from, to }),
    getSalesByPaymentMethod({ from, to }),
    getSalesBySalesperson({ from, to }),
  ]);

  const paymentLabels: Record<string, string> = { CASH: "Cash", BANK_TRANSFER: "Bank Transfer", CARD: "Card / POS" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(summary.totalSales, currencySymbol)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.transactionCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg. Transaction Value</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatMoney(summary.averageTransactionValue, currencySymbol)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales by salesperson</CardTitle>
          <ExportButton href={`/api/reports?type=sales&from=${fromStr}&to=${toStr}`} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySalesperson.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No sales in this period.
                  </TableCell>
                </TableRow>
              )}
              {bySalesperson.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell className="text-right">{row.transactionCount}</TableCell>
                  <TableCell className="text-right">{formatMoney(row.totalSales, currencySymbol)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales by payment method</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byPaymentMethod.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No sales in this period.
                  </TableCell>
                </TableRow>
              )}
              {byPaymentMethod.map((row) => (
                <TableRow key={row.method}>
                  <TableCell>{paymentLabels[row.method] ?? row.method}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">{formatMoney(row.total, currencySymbol)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

async function ProductsReport({
  from,
  to,
  fromStr,
  toStr,
  currencySymbol,
}: {
  from: Date;
  to: Date;
  fromStr: string;
  toStr: string;
  currencySymbol: string;
}) {
  const topProducts = await getTopSellingProducts({ from, to, limit: 25 });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top selling products</CardTitle>
        <div className="flex gap-2">
          <ExportButton href={`/api/reports?type=top-products&from=${fromStr}&to=${toStr}`} />
          <ExportButton href="/api/reports?type=products" />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity Sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No sales in this period.
                </TableCell>
              </TableRow>
            )}
            {topProducts.map((product) => (
              <TableRow key={product.productId}>
                <TableCell>{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                <TableCell className="text-right">{product.quantitySold}</TableCell>
                <TableCell className="text-right">{formatMoney(product.revenue, currencySymbol)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

async function CustomersReport({ currencySymbol }: { currencySymbol: string }) {
  const [total, topCustomers] = await Promise.all([countCustomers(), getTopCustomers(25)]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Customers</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{total}</CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top customers</CardTitle>
          <ExportButton href="/api/reports?type=customers" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No purchases recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {topCustomers.map((customer) => (
                <TableRow key={customer.customerId}>
                  <TableCell>{customer.fullName}</TableCell>
                  <TableCell className="text-right">{customer.purchaseCount}</TableCell>
                  <TableCell className="text-right">{formatMoney(customer.totalSpent, currencySymbol)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

async function InventoryReport({ from, to, fromStr, toStr }: { from: Date; to: Date; fromStr: string; toStr: string }) {
  const [activeProducts, lowStock, outOfStock, movements] = await Promise.all([
    countActiveProducts(),
    getLowStockProducts(),
    getOutOfStockProducts(),
    listMovements({ from, to, pageSize: 50 }),
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Products</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{activeProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-600">{lowStock.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">{outOfStock.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock movements</CardTitle>
          <ExportButton href={`/api/reports?type=inventory&from=${fromStr}&to=${toStr}`} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">New Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No stock movements in this period.
                  </TableCell>
                </TableRow>
              )}
              {movements.items.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {movement.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>{movement.product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{movement.type}</Badge>
                  </TableCell>
                  <TableCell className={`text-right ${movement.quantity < 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                  </TableCell>
                  <TableCell className="text-right">{movement.newStock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
