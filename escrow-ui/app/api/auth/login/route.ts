import { NextRequest, NextResponse } from "next/server";
import { setSessionUserId } from "@/lib/trade-mvp/session";
import { login } from "@/lib/trade-mvp/store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "email and password are required" }, { status: 400 });
    }
    const user = await login({ email, password });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }
    await setSessionUserId(user.id);
    return NextResponse.json({ ok: true, data: user });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to login";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
