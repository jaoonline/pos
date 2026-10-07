import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { homeRouteForRole } from "@/lib/auth";

const ADMIN_ONLY_PREFIXES = [
  "/admin",
  "/products",
  "/categories",
  "/customers",
  "/salespersons",
  "/settings",
  "/reports",
  "/inventory",
];

const PUBLIC_PATHS = ["/login"];

// Reachable by anyone, signed in or not, without any redirect.
const OPEN_PATHS = ["/docs"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (OPEN_PATHS.includes(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!session) {
    if (isPublicPath) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath) {
    return NextResponse.redirect(new URL(homeRouteForRole(session.role), request.url));
  }

  const isAdminOnlyPath = ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAdminOnlyPath && session.role !== "ADMINISTRATOR") {
    return NextResponse.redirect(new URL(homeRouteForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
