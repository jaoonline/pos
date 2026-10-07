import { requireUserForPage } from "@/lib/auth";
import { createSalespersonAction } from "@/actions/users";
import { SalespersonForm } from "@/components/salespersons/salesperson-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewSalespersonPage() {
  await requireUserForPage(["ADMINISTRATOR"]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Add Salesperson</h1>
        <p className="text-sm text-muted-foreground">
          Create a new salesperson account. They will always be created with the Salesperson role.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <SalespersonForm action={createSalespersonAction} submitLabel="Create Salesperson" />
        </CardContent>
      </Card>
    </div>
  );
}
