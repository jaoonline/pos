import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUserForPage } from "@/lib/auth";
import { listProducts, type ProductFilters as ProductFiltersType } from "@/services/products";
import { listCategories } from "@/services/categories";
import { getShopSettings } from "@/services/settings";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductRowActions } from "@/components/products/product-row-actions";

function pickString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserForPage(["ADMINISTRATOR"]);

  const sp = await searchParams;
  const search = pickString(sp.search);
  const categoryId = pickString(sp.category);
  const status = pickString(sp.status) as ProductFiltersType["status"];
  const stock = pickString(sp.stock) as ProductFiltersType["stock"];
  const pageParam = pickString(sp.page);
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;

  const [{ items, total, pageSize }, categories, settings] = await Promise.all([
    listProducts({ search, categoryId, status, stock, page }),
    listCategories({ includeInactive: true }),
    getShopSettings(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog, pricing and stock levels.
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-1 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <ProductFilters categories={categories} />

          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No products found. Try adjusting your filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((product) => {
                  const isOut = product.stockQuantity <= 0;
                  const isLow = !isOut && product.stockQuantity <= product.minStockLevel;
                  return (
                    <TableRow
                      key={product.id}
                      className={!product.isActive ? "opacity-60" : undefined}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell>{product.category.name}</TableCell>
                      <TableCell>{formatMoney(product.costPrice, settings.currencySymbol)}</TableCell>
                      <TableCell>{formatMoney(product.sellingPrice, settings.currencySymbol)}</TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge variant="destructive">Out of stock</Badge>
                        ) : isLow ? (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                            Low stock &middot; {product.stockQuantity} {product.unit}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {product.stockQuantity} {product.unit}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "secondary" : "outline"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ProductRowActions productId={product.id} isActive={product.isActive} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            basePath="/products"
            searchParams={{ search, category: categoryId, status, stock }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
