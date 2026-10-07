import { requireUserForPage } from "@/lib/auth";
import { getShopSettings } from "@/services/settings";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  await requireUserForPage(["ADMINISTRATOR"]);
  const settings = await getShopSettings();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Shop Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your shop&apos;s identity, currency and receipt details.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="pt-4">
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
