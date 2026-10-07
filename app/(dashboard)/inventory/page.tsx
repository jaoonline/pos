import Link from "next/link";
import { AlertTriangle, PackageX } from "lucide-react";
import { requireUserForPage } from "@/lib/auth";
import { listMovements, getLowStockProducts, getOutOfStockProducts } from "@/services/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pagination } from "@/components/shared/pagination";
import type { InventoryMovementType } from "@/generated/prisma/client";

const PAGE_SIZE = 25;

const MOVEMENT_TYPES: InventoryMovementType[] = [
  "INITIAL_STOCK",
  "STOCK_ADDITION",
  "SALE",
  "REFUND",
  "ADJUSTMENT",
];

const MOVEMENT_TYPE_LABEL: Record<InventoryMovementType, string> = {
  INITIAL_STOCK: "Initial stock",
  STOCK_ADDITION: "Stock addition",
  SALE: "Sale",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

function movementBadgeVariant(type: InventoryMovementType): "default" | "secondary" | "outline" {
  if (type === "SALE") return "outline";
  if (type === "ADJUSTMENT") return "secondary";
  return "default";
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireUserForPage(["ADMINISTRATOR"]);

  const params = await searchParams;
  const type = params.type ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";
  const page = Number(params.page) || 1;

  const [lowStockProducts, outOfStockProducts, { items: movements, total }] = await Promise.all([
    getLowStockProducts(),
    getOutOfStockProducts(),
    listMovements({
      type: type ? (type as InventoryMovementType) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(`${to}T23:59:59.999`) : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Stock alerts and a full history of every stock movement.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low stock ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing is running low.</p>
            ) : (
              <ul className="divide-y">
                {lowStockProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                      <span className="font-medium">{product.name}</span>{" "}
                      <span className="text-muted-foreground">({product.sku})</span>
                    </Link>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {product.stockQuantity} / min {product.minStockLevel}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageX className="h-4 w-4 text-destructive" />
              Out of stock ({outOfStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outOfStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products are out of stock.</p>
            ) : (
              <ul className="divide-y">
                {outOfStockProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                      <span className="font-medium">{product.name}</span>{" "}
                      <span className="text-muted-foreground">({product.sku})</span>
                    </Link>
                    <Badge variant="destructive">{product.stockQuantity} in stock</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movement history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="type">
                Type
              </label>
              <select id="type" name="type" defaultValue={type} className={selectClassName}>
                <option value="">All types</option>
                {MOVEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MOVEMENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
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

            <div className="flex items-end gap-2">
              <Button type="submit" variant="outline" className="w-full">
                Filter
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link href="/inventory" title="Clear filters">
                  &times;
                </Link>
              </Button>
            </div>
          </form>

          {movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No stock movements yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">New</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.createdAt.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="font-medium">{movement.product.name}</span>{" "}
                      <span className="text-xs text-muted-foreground">{movement.product.sku}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={movementBadgeVariant(movement.type)}>
                        {MOVEMENT_TYPE_LABEL[movement.type]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        movement.quantity > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : movement.quantity < 0
                            ? "text-destructive"
                            : ""
                      }`}
                    >
                      {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                    </TableCell>
                    <TableCell className="text-right">{movement.previousStock}</TableCell>
                    <TableCell className="text-right">{movement.newStock}</TableCell>
                    <TableCell className="text-muted-foreground">{movement.reason ?? "—"}</TableCell>
                    <TableCell>{movement.user.fullName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/inventory"
            searchParams={{ type, from, to }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
