import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import * as userService from "@/services/users";
import { verifyPassword } from "@/lib/password";

const RUN_ID = `${Date.now()}`;
const EMAIL = `salesperson-create-${RUN_ID}@example.com`;

const createdUserIds: string[] = [];

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

describe("createSalesperson", () => {
  it("always forces role SALESPERSON regardless of caller intent", async () => {
    const user = await userService.createSalesperson({
      fullName: "New Hire",
      email: EMAIL,
      password: "SomeStrongPass1",
    });
    createdUserIds.push(user.id);

    expect(user.role).toBe("SALESPERSON");
    expect(user.isActive).toBe(true);
  });

  it("hashes the password rather than storing it in plain text", async () => {
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(dbUser.passwordHash).not.toBe("SomeStrongPass1");
    expect(await verifyPassword("SomeStrongPass1", dbUser.passwordHash)).toBe(true);
  });
});

describe("isEmailTaken", () => {
  it("detects an existing email", async () => {
    expect(await userService.isEmailTaken(EMAIL)).toBe(true);
  });

  it("returns false for an unused email", async () => {
    expect(await userService.isEmailTaken(`unused-${RUN_ID}@example.com`)).toBe(false);
  });
});

describe("setSalespersonActive", () => {
  it("can deactivate and reactivate a salesperson", async () => {
    const user = await userService.createSalesperson({
      fullName: "Toggle Tester",
      email: `toggle-${RUN_ID}@example.com`,
      password: "SomeStrongPass1",
    });
    createdUserIds.push(user.id);

    await userService.setSalespersonActive(user.id, false);
    let updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.isActive).toBe(false);

    await userService.setSalespersonActive(user.id, true);
    updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.isActive).toBe(true);
  });
});

describe("getSalespersonById", () => {
  it("does not return an administrator through the salesperson lookup", async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMINISTRATOR" } });
    expect(admin).not.toBeNull();
    if (admin) {
      const result = await userService.getSalespersonById(admin.id);
      expect(result).toBeNull();
    }
  });
});
