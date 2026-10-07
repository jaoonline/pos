import { requireUserForPage } from "@/lib/auth";
import { listCategories } from "@/services/categories";
import { createProductAction } from "@/actions/products";
import { ProductForm } from "@/components/products/product-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewProductPage() {
  await requireUserForPage(["ADMINISTRATOR"]);
  const categories = await listCategories({ includeInactive: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Add Product</h1>
        <p className="text-sm text-muted-foreground">Create a new product in your catalog.</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <ProductForm
            action={createProductAction}
            categories={categories}
            submitLabel="Create Product"
          />
        </CardContent>
      </Card>
    </div>
  );
}
