"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ChevronsUpDown, UserPlus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchCustomersAction, quickCreateCustomerAction } from "@/actions/customers";
import { toast } from "sonner";
import type { CustomerOption } from "@/lib/types";

export function CustomerPicker({
  value,
  onChange,
}: {
  value: CustomerOption | null;
  onChange: (customer: CustomerOption | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const customers = await searchCustomersAction(query);
        setResults(customers.map((c) => ({ id: c.id, fullName: c.fullName, phone: c.phone })));
      });
    }, 200);
    return () => clearTimeout(handle);
     
  }, [query, open]);

  async function handleQuickCreate() {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const customer = await quickCreateCustomerAction({ fullName: query.trim() });
      onChange({ id: customer.id, fullName: customer.fullName, phone: customer.phone });
      setOpen(false);
      setQuery("");
      toast.success("Customer added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add customer");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2 truncate">
            <UserRound className="h-4 w-4 shrink-0" />
            {value ? value.fullName : "Walk-in Customer"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Input
          autoFocus
          placeholder="Search name or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-56 space-y-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
              setQuery("");
            }}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
          >
            Walk-in Customer
            {!value && <Check className="h-4 w-4" />}
          </button>
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => {
                onChange(customer);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <span className="truncate">
                {customer.fullName}
                {customer.phone && <span className="text-muted-foreground"> &middot; {customer.phone}</span>}
              </span>
              {value?.id === customer.id && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
          {!isPending && query.trim() && results.length === 0 && (
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              disabled={creating}
              onClick={handleQuickCreate}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add &quot;{query.trim()}&quot; as new customer
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
