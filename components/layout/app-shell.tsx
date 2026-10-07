"use client";

import { useState } from "react";
import { Menu, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { getNavForRole } from "@/lib/nav";
import type { Role } from "@/generated/prisma/client";

export function AppShell({
  shopName,
  user,
  children,
}: {
  shopName: string;
  user: { fullName: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNavForRole(user.role);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
          <Store className="h-5 w-5" />
          <span className="truncate">{shopName}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav items={navItems} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold md:hidden">{shopName}</span>
          </div>
          <UserMenu fullName={user.fullName} email={user.email} role={user.role} />
        </header>

        <main className="flex-1 overflow-x-hidden bg-muted/20 p-4 md:p-6">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="h-14 justify-center border-b px-4">
            <SheetTitle className="flex items-center gap-2 text-left">
              <Store className="h-5 w-5" />
              {shopName}
            </SheetTitle>
          </SheetHeader>
          <SidebarNav items={navItems} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
