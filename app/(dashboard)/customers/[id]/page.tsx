import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { requireUserForPage } from "@/lib/auth";
import { getCustomerById, getCustomerPurchaseHistory } from "@/services/customers";
import { getShopSettings } from "@/services/settings";
import { updateCustomerAction } from "@/actions/customers";
import { formatMoney } from "@/lib/money";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "secondary",
  CANCELLED: "outline",
  REFUNDED: "destructive",
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  await requireUserForPage(["ADMINISTRATOR"]);

  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const [history, settings] = await Promise.all([
    getCustomerPurchaseHistory(id, page, PAGE_SIZE),
    getShopSettings(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/customers" className="text-sm text-muted-foreground hover:underline">
            &larr; Back to customers
          </Link>
          <h1 className="font-heading text-xl font-semibold">{customer.fullName}</h1>
        </div>
        <CustomerFormDialog
          action={updateCustomerAction.bind(null, id)}
          title="Edit customer"
          description="Update this customer's details."
          defaultValues={customer}
          trigger={
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm">{customer.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm">{customer.email || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="text-sm">{customer.address || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{customer.notes || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatMoney(history.totalSpent, settings.currencySymbol)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{history.purchaseCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.sales.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No purchases yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Link href={`/sales/${sale.id}`} className="font-medium hover:underline">
                        {sale.receiptNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{sale.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>{sale.items.length}</TableCell>
                    <TableCell>{formatMoney(sale.totalAmount, settings.currencySymbol)}</TableCell>
                    <TableCell>{sale.payment?.method ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[sale.status] ?? "outline"}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={history.total}
            basePath={`/customers/${id}`}
            searchParams={{}}
          />
        </CardContent>
      </Card>
    </div>
  );
}
