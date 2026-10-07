import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUserForPage } from "@/lib/auth";
import { getSalespersonById } from "@/services/users";
import { listSales } from "@/services/sales";
import { getShopSettings } from "@/services/settings";
import { updateSalespersonAction, resetSalespersonPasswordAction } from "@/actions/users";
import { formatMoney } from "@/lib/money";
import { SalespersonForm } from "@/components/salespersons/salesperson-form";
import { SalespersonActivationButton } from "@/components/salespersons/salesperson-activation-button";
import { ResetPasswordDialog } from "@/components/salespersons/reset-password-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function EditSalespersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUserForPage(["ADMINISTRATOR"]);
  const { id } = await params;

  const salesperson = await getSalespersonById(id);
  if (!salesperson) {
    notFound();
  }

  const [{ items: recentSales }, settings] = await Promise.all([
    listSales({ userId: id, pageSize: 10 }),
    getShopSettings(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/salespersons">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-semibold">{salesperson.fullName}</h1>
              <Badge variant={salesperson.isActive ? "secondary" : "outline"}>
                {salesperson.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{salesperson.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ResetPasswordDialog action={resetSalespersonPasswordAction.bind(null, salesperson.id)} />
          <SalespersonActivationButton
            salespersonId={salesperson.id}
            isActive={salesperson.isActive}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Salesperson details</CardTitle>
          </CardHeader>
          <CardContent>
            <SalespersonForm
              action={updateSalespersonAction.bind(null, salesperson.id)}
              salesperson={salesperson}
              submitLabel="Save Changes"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <Link href={`/sales/${sale.id}`} className="text-primary hover:underline">
                          {sale.receiptNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {sale.createdAt.toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(sale.totalAmount, settings.currencySymbol)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
