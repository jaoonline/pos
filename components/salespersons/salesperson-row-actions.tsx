"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SalespersonActivationButton } from "@/components/salespersons/salesperson-activation-button";

export function SalespersonRowActions({
  salespersonId,
  isActive,
}: {
  salespersonId: string;
  isActive: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/salespersons/${salespersonId}`}>Edit</Link>
      </Button>
      <SalespersonActivationButton salespersonId={salespersonId} isActive={isActive} />
    </div>
  );
}
