import "server-only";
import { prisma } from "@/lib/prisma";

export async function getShopSettings() {
  const settings = await prisma.shopSetting.findUnique({ where: { id: 1 } });
  if (settings) return settings;

  return prisma.shopSetting.create({
    data: { id: 1 },
  });
}

export type ShopSettingsInput = {
  shopName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  receiptFooter?: string | null;
  currencyCode: string;
  currencySymbol: string;
  allowNegativeStock: boolean;
};

export async function updateShopSettings(data: ShopSettingsInput) {
  return prisma.shopSetting.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}
