"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, PackagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchProductsAction } from "@/actions/products";
import { formatMoney } from "@/lib/money";
import type { SellableProduct } from "@/lib/types";

export function ProductGrid({
  initialProducts,
  currencySymbol,
  onAdd,
}: {
  initialProducts: SellableProduct[];
  currencySymbol: string;
  onAdd: (product: SellableProduct) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SellableProduct[]>(initialProducts);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        if (!query.trim()) {
          setResults(initialProducts);
          return;
        }
        const products = await searchProductsAction(query);
        setResults(products);
      });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search by product name or SKU..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto pb-2 sm:grid-cols-3 xl:grid-cols-4">
        {results.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            {isPending ? "Searching..." : "No products found."}
          </p>
        )}
        {results.map((product) => {
          const isOut = product.stockQuantity <= 0;
          return (
            <button
              key={product.id}
              type="button"
              disabled={isOut}
              onClick={() => onAdd(product)}
              className="flex flex-col items-start rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="mb-2 flex w-full items-start justify-between gap-2">
                <span className="line-clamp-2 text-sm font-medium">{product.name}</span>
                <PackagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">{product.sku}</span>
              <div className="mt-2 flex w-full items-center justify-between">
                <span className="font-semibold">{formatMoney(product.sellingPrice, currencySymbol)}</span>
                <Badge variant={isOut ? "destructive" : product.stockQuantity <= 10 ? "outline" : "secondary"}>
                  {isOut ? "Out of stock" : `${product.stockQuantity} ${product.unit}`}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
