import { notFound } from "next/navigation";
import { requireUserForPage } from "@/lib/auth";
import { getProductById } from "@/services/products";
import { listCategories } from "@/services/categories";
import { updateProductAction } from "@/actions/products";
import { ProductForm } from "@/components/products/product-form";
import { ProductActivationButton } from "@/components/products/product-activation-button";
import { StockCard } from "@/components/products/stock-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUserForPage(["ADMINISTRATOR"]);
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductById(id),
    listCategories({ includeInactive: true }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-semibold">{product.name}</h1>
            <Badge variant={product.isActive ? "secondary" : "outline"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>
        <ProductActivationButton productId={product.id} isActive={product.isActive} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              action={updateProductAction.bind(null, product.id)}
              categories={categories}
              product={product}
              submitLabel="Save Changes"
              hideInitialStock
            />
          </CardContent>
        </Card>

        <StockCard productId={product.id} currentStock={product.stockQuantity} unit={product.unit} />
      </div>
    </div>
  );
}
