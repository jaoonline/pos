import { requireUserForPage } from "@/lib/auth";
import { searchSellableProducts } from "@/services/products";
import { getShopSettings } from "@/services/settings";
import { toNumber } from "@/lib/money";
import { PosScreen } from "@/components/pos/pos-screen";

export default async function PosPage() {
  await requireUserForPage(["ADMINISTRATOR", "SALESPERSON"]);

  const [products, settings] = await Promise.all([
    searchSellableProducts("", 60),
    getShopSettings(),
  ]);

  return (
    <PosScreen
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        sellingPrice: toNumber(p.sellingPrice),
        stockQuantity: p.stockQuantity,
        unit: p.unit,
      }))}
      currencySymbol={settings.currencySymbol}
      shopName={settings.shopName}
      shopAddress={settings.address}
      shopPhone={settings.phone}
      receiptFooter={settings.receiptFooter}
    />
  );
}
