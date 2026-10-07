import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;
const adapter = new PrismaPg({ connectionString }, schema ? { schema } : undefined);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@shop.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  await prisma.shopSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      shopName: "My Shop",
      address: "1 Market Street, Lagos",
      phone: "+234 000 000 0000",
      email: "shop@example.com",
      receiptFooter: "Thank you for your patronage!",
      currencyCode: "NGN",
      currencySymbol: "₦",
      allowNegativeStock: false,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: "Shop Administrator",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMINISTRATOR",
      isActive: true,
    },
  });
  console.log(`Administrator ready: ${admin.email}`);

  const salesperson = await prisma.user.upsert({
    where: { email: "salesperson@shop.local" },
    update: {},
    create: {
      fullName: "Demo Salesperson",
      email: "salesperson@shop.local",
      passwordHash: await bcrypt.hash("Salesperson123!", 12),
      role: "SALESPERSON",
      isActive: true,
    },
  });
  console.log(`Salesperson ready: ${salesperson.email}`);

  const categories = await Promise.all(
    [
      { name: "Beverages", description: "Soft drinks, juices and water" },
      { name: "Snacks", description: "Packaged snacks and confectionery" },
      { name: "Groceries", description: "Everyday household groceries" },
    ].map((c) =>
      prisma.category.upsert({ where: { name: c.name }, update: {}, create: c })
    )
  );

  const productSeeds = [
    { sku: "BEV-001", name: "Bottled Water 50cl", categoryIdx: 0, cost: 80, price: 150, stock: 200, min: 20 },
    { sku: "BEV-002", name: "Cola 35cl Can", categoryIdx: 0, cost: 150, price: 300, stock: 150, min: 20 },
    { sku: "SNK-001", name: "Potato Chips 50g", categoryIdx: 1, cost: 200, price: 400, stock: 100, min: 10 },
    { sku: "SNK-002", name: "Chocolate Bar", categoryIdx: 1, cost: 250, price: 500, stock: 80, min: 10 },
    { sku: "GRO-001", name: "Rice 1kg", categoryIdx: 2, cost: 900, price: 1200, stock: 60, min: 10 },
    { sku: "GRO-002", name: "Cooking Oil 1L", categoryIdx: 2, cost: 1400, price: 1800, stock: 40, min: 5 },
  ];

  for (const p of productSeeds) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        categoryId: categories[p.categoryIdx].id,
        costPrice: p.cost,
        sellingPrice: p.price,
        stockQuantity: p.stock,
        minStockLevel: p.min,
        unit: "pcs",
        isActive: true,
      },
    });

    const existingMovement = await prisma.inventoryMovement.findFirst({
      where: { productId: product.id, type: "INITIAL_STOCK" },
    });
    if (!existingMovement) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          userId: admin.id,
          type: "INITIAL_STOCK",
          quantity: p.stock,
          previousStock: 0,
          newStock: p.stock,
          reason: "Initial stock on setup",
        },
      });
    }
  }

  await prisma.customer.upsert({
    where: { phone: "+2348000000001" },
    update: {},
    create: {
      fullName: "Jane Doe",
      phone: "+2348000000001",
      email: "jane.doe@example.com",
      address: "12 Palm Avenue, Lagos",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
