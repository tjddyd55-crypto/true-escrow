import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, buildSessionCookieOptions } from "@/lib/trade-mvp/session";
import { signup } from "@/lib/trade-mvp/store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; name?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "email and password are required" }, { status: 400 });
    }
    const user = await signup({ email, password, name: body.name });
    const response = NextResponse.json({ ok: true, data: user });
    response.cookies.set(SESSION_COOKIE_NAME, user.id, buildSessionCookieOptions());
    return response;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to sign up";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
