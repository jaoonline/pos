import type { Role } from "@/generated/prisma/client";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  Receipt,
  Boxes,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "New Sale", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/salespersons", label: "Salespersons", icon: UserCog },
  { href: "/settings", label: "Settings", icon: Settings },
];

const salespersonNav: NavItem[] = [
  { href: "/pos", label: "New Sale", icon: ShoppingCart },
  { href: "/sales", label: "My Sales", icon: Receipt },
];

export function getNavForRole(role: Role): NavItem[] {
  return role === "ADMINISTRATOR" ? adminNav : salespersonNav;
}
