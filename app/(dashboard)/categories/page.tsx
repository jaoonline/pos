import Link from "next/link";
import { requireUserForPage } from "@/lib/auth";
import { listCategories } from "@/services/categories";
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
import { AddCategoryButton } from "@/components/categories/add-category-button";
import { CategoryRowActions } from "@/components/categories/category-row-actions";

export default async function CategoriesPage() {
  await requireUserForPage(["ADMINISTRATOR"]);
  const categories = await listCategories({ includeInactive: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize your product catalog into categories.
          </p>
        </div>
        <AddCategoryButton />
      </div>

      <Card>
        <CardContent className="pt-4">
          {categories.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No categories yet &mdash; create your first one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow
                    key={category.id}
                    className={!category.isActive ? "opacity-60" : undefined}
                  >
                    <TableCell className="font-medium">
                      <Link href={`/products?category=${category.id}`} className="hover:underline">
                        {category.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell>{category._count.products}</TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "secondary" : "outline"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <CategoryRowActions
                        category={{
                          id: category.id,
                          name: category.name,
                          description: category.description,
                          isActive: category.isActive,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
