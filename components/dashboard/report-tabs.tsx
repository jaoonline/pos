import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "sales", label: "Sales" },
  { key: "products", label: "Products" },
  { key: "customers", label: "Customers" },
  { key: "inventory", label: "Inventory" },
];

export function ReportTabs({ active, from, to }: { active: string; from: string; to: string }) {
  return (
    <div className="inline-flex rounded-md border bg-muted p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/reports?tab=${tab.key}&from=${from}&to=${to}`}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            active === tab.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
