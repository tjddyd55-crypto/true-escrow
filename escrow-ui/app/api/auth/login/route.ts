import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, buildSessionCookieOptions } from "@/lib/trade-mvp/session";
import { login, signup } from "@/lib/trade-mvp/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "email and password are required" }, { status: 400 });
    }
    let user = await login({ email, password });
    if (!user) {
      // UX guardrail for MVP: first login can bootstrap account.
      try {
        user = await signup({ email, password });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Invalid credentials";
        if (message === "Email already exists") {
          return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
        }
        throw e;
      }
    }
    const response = NextResponse.json({ ok: true, data: user });
    response.cookies.set(SESSION_COOKIE_NAME, user.id, buildSessionCookieOptions());
    return response;
  } catch (e: unknown) {
    console.error("[auth/login] failed:", e);
    return NextResponse.json({ ok: false, error: "로그인 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
