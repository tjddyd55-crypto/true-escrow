"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type InviteInfo = {
  invite: { status: string };
  participant: { role: string; inviteType: string; inviteTarget: string };
  trade: { id: string; title: string };
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [token]);

  async function load() {
    const [inviteRes, meRes] = await Promise.all([fetch(`/api/invites/${token}`), fetch("/api/me")]);
    const inviteJson = await inviteRes.json().catch(() => ({}));
    const meJson = await meRes.json().catch(() => ({}));
    if (!inviteRes.ok || !inviteJson.ok) {
      setError(inviteJson.error ?? "초대를 찾을 수 없습니다.");
      return;
    }
    setInfo(inviteJson.data);
    setMe(meJson.ok ? meJson.data : null);
  }

  async function accept() {
    const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "수락 실패");
      return;
    }
    router.push(`/trades/${info?.trade.id}`);
  }

  async function decline() {
    const res = await fetch(`/api/invites/${token}/decline`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "거절 실패");
      return;
    }
    router.push("/dashboard");
  }

  if (error) return <main className="max-w-xl mx-auto p-6 text-red-600">{error}</main>;
  if (!info) return <main className="max-w-xl mx-auto p-6">Loading...</main>;

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Invite</h1>
      <div className="border rounded p-4 space-y-1">
        <div className="font-medium">{info.trade.title}</div>
        <div className="text-sm text-gray-600">Role: {info.participant.role}</div>
        <div className="text-sm text-gray-600">
          Target: {info.participant.inviteType} / {info.participant.inviteTarget}
        </div>
        <div className="text-sm text-gray-600">Status: {info.invite.status}</div>
      </div>
      {!me ? (
        <div className="space-y-2">
          <p>초대를 수락하려면 로그인 또는 회원가입이 필요합니다.</p>
          <div className="flex gap-3">
            <Link href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded">Login</Link>
            <Link href="/auth/signup" className="px-4 py-2 border rounded">Sign up</Link>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={accept} className="px-4 py-2 rounded bg-green-600 text-white">Accept</button>
          <button onClick={decline} className="px-4 py-2 rounded border">Decline</button>
        </div>
      )}
    </main>
  );
}
