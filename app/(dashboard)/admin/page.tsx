import Link from "next/link";
import { requireUserForPage } from "@/lib/auth";
import {
  getDashboardStats,
  getRecentSales,
  getSalesTrend,
  getTopSellingProducts,
  getSalesBySalesperson,
} from "@/services/reports";
import { getLowStockProducts } from "@/services/inventory";
import { getShopSettings } from "@/services/settings";
import { formatMoney } from "@/lib/money";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, Package, AlertTriangle, Users, UserCheck } from "lucide-react";

export default async function AdminDashboardPage() {
  await requireUserForPage(["ADMINISTRATOR"]);

  const [stats, recentSales, salesTrend, topProducts, bySalesperson, lowStock, settings] = await Promise.all([
    getDashboardStats(),
    getRecentSales(8),
    getSalesTrend(14),
    getTopSellingProducts({ limit: 5 }),
    getSalesBySalesperson(),
    getLowStockProducts(8),
    getShopSettings(),
  ]);

  const currencySymbol = settings.currencySymbol;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of today&apos;s activity and shop health.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Today's Sales" value={formatMoney(stats.todaysSales, currencySymbol)} icon={DollarSign} />
        <StatCard label="Today's Transactions" value={stats.todaysTransactions} icon={Receipt} />
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} />
        <StatCard
          label="Low Stock"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          tone={stats.lowStockCount > 0 ? "warning" : "default"}
        />
        <StatCard label="Customers" value={stats.totalCustomers} icon={Users} />
        <StatCard label="Active Salespersons" value={stats.activeSalespersons} icon={UserCheck} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales trend (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={salesTrend} currencySymbol={currencySymbol} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.length === 0 && <p className="text-sm text-muted-foreground">All products are well stocked.</p>}
            {lowStock.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <Badge variant={product.stockQuantity <= 0 ? "destructive" : "outline"}>
                  {product.stockQuantity} left
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      No sales yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Link href={`/sales/${sale.id}`} className="font-medium hover:underline">
                        {sale.receiptNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{sale.customer?.fullName ?? "Walk-in Customer"}</TableCell>
                    <TableCell>{sale.user.fullName}</TableCell>
                    <TableCell className="text-right">{formatMoney(sale.totalAmount, currencySymbol)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topProducts.length === 0 && <p className="text-sm text-muted-foreground">No sales recorded yet.</p>}
            {topProducts.map((product) => (
              <div key={product.productId} className="flex items-center justify-between text-sm">
                <span className="truncate">{product.name}</span>
                <span className="shrink-0 text-muted-foreground">{product.quantitySold} sold</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales by salesperson</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySalesperson.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No sales recorded yet.
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
    </div>
  );
}
