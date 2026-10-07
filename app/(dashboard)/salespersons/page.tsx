import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUserForPage } from "@/lib/auth";
import { listSalespersons, type SalespersonFilters as SalespersonFiltersType } from "@/services/users";
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
import { SalespersonFilters } from "@/components/salespersons/salesperson-filters";
import { SalespersonRowActions } from "@/components/salespersons/salesperson-row-actions";

function pickString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function SalespersonsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserForPage(["ADMINISTRATOR"]);

  const sp = await searchParams;
  const search = pickString(sp.search);
  const status = pickString(sp.status) as SalespersonFiltersType["status"];
  const pageParam = pickString(sp.page);
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;

  const { items, total, pageSize } = await listSalespersons({ search, status, page });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Salespersons</h1>
          <p className="text-sm text-muted-foreground">
            Manage salesperson accounts and their access to the POS.
          </p>
        </div>
        <Button asChild>
          <Link href="/salespersons/new">
            <Plus className="mr-1 h-4 w-4" /> Add Salesperson
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <SalespersonFilters />

          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No salespersons found. Try adjusting your filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((salesperson) => (
                  <TableRow
                    key={salesperson.id}
                    className={!salesperson.isActive ? "opacity-60" : undefined}
                  >
                    <TableCell className="font-medium">{salesperson.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{salesperson.email}</TableCell>
                    <TableCell>
                      <Badge variant={salesperson.isActive ? "secondary" : "outline"}>
                        {salesperson.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{salesperson._count.sales}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {salesperson.lastLoginAt ? salesperson.lastLoginAt.toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <SalespersonRowActions
                        salespersonId={salesperson.id}
                        isActive={salesperson.isActive}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            basePath="/salespersons"
            searchParams={{ search, status }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
