import { requireUserForPage } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { getShopSettings } from "@/services/settings";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserForPage();
  const shopSettings = await getShopSettings();

  return (
    <AppShell shopName={shopSettings.shopName} user={user}>
      {children}
    </AppShell>
  );
}
