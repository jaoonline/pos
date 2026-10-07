"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductActivationButton } from "@/components/products/product-activation-button";

export function ProductRowActions({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/products/${productId}`}>Edit</Link>
      </Button>
      <ProductActivationButton productId={productId} isActive={isActive} />
    </div>
  );
}
