import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/trade-mvp/session";

const PROTECTED_PREFIXES = ["/dashboard", "/transaction/new", "/transactions", "/trades"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!needsAuth) return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (session) return NextResponse.next();

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/transaction/new", "/transactions/:path*", "/trades/:path*"],
};
