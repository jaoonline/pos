import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireUserForPage } from "@/lib/auth";
import { listCustomers } from "@/services/customers";
import { createCustomerAction } from "@/actions/customers";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  await requireUserForPage(["ADMINISTRATOR"]);

  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page) || 1;

  const { items: customers, total } = await listCustomers({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer records and view purchase history.
          </p>
        </div>
        <CustomerFormDialog
          action={createCustomerAction}
          title="Add customer"
          description="Create a new customer record."
          trigger={
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <form method="get" className="flex gap-2">
            <Input
              name="search"
              placeholder="Search by name, phone or email..."
              defaultValue={search}
              className="max-w-sm"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          {customers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No customers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.fullName}</TableCell>
                    <TableCell>
                      {customer.phone || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {customer.email || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{customer._count.sales}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/customers/${customer.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/customers"
            searchParams={{ search }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
