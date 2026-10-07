import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", tone === "warning" && "text-amber-500")} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", tone === "warning" && value !== 0 && "text-amber-600")}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
