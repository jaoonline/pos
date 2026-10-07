import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { authenticateUser } from "@/services/auth";

const RUN_ID = `${Date.now()}`;
const ACTIVE_EMAIL = `active-${RUN_ID}@example.com`;
const INACTIVE_EMAIL = `inactive-${RUN_ID}@example.com`;
const PASSWORD = "CorrectHorseBattery1";

let activeUserId: string;
let inactiveUserId: string;

beforeAll(async () => {
  const active = await prisma.user.create({
    data: {
      fullName: "Active Tester",
      email: ACTIVE_EMAIL,
      passwordHash: await hashPassword(PASSWORD),
      role: "SALESPERSON",
      isActive: true,
    },
  });
  activeUserId = active.id;

  const inactive = await prisma.user.create({
    data: {
      fullName: "Deactivated Tester",
      email: INACTIVE_EMAIL,
      passwordHash: await hashPassword(PASSWORD),
      role: "SALESPERSON",
      isActive: false,
    },
  });
  inactiveUserId = inactive.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [activeUserId, inactiveUserId] } } });
});

describe("authenticateUser", () => {
  it("succeeds with correct credentials for an active user", async () => {
    const result = await authenticateUser(ACTIVE_EMAIL, PASSWORD);
    expect(result.success).toBe(true);
  });

  it("fails with an incorrect password", async () => {
    const result = await authenticateUser(ACTIVE_EMAIL, "wrong-password");
    expect(result.success).toBe(false);
  });

  it("fails for a non-existent email", async () => {
    const result = await authenticateUser("nobody@example.com", PASSWORD);
    expect(result.success).toBe(false);
  });

  it("fails for a deactivated account even with the correct password", async () => {
    const result = await authenticateUser(INACTIVE_EMAIL, PASSWORD);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/deactivated/i);
    }
  });
});

describe("database uniqueness constraints", () => {
  it("prevents two users from sharing a login email", async () => {
    await expect(
      prisma.user.create({
        data: {
          fullName: "Duplicate Tester",
          email: ACTIVE_EMAIL,
          passwordHash: await hashPassword(PASSWORD),
          role: "SALESPERSON",
        },
      })
    ).rejects.toThrow();
  });
});
