import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const OWNER_COOKIE_KEY = "escrow_owner_key";

export async function getOrCreateOwnerKey(): Promise<{ ownerKey: string; shouldSetCookie: boolean }> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(OWNER_COOKIE_KEY)?.value;
  if (existing && existing.trim()) {
    return { ownerKey: existing, shouldSetCookie: false };
  }
  return { ownerKey: crypto.randomUUID(), shouldSetCookie: true };
}

export function applyOwnerCookie(res: NextResponse, ownerKey: string): NextResponse {
  res.cookies.set(OWNER_COOKIE_KEY, ownerKey, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
