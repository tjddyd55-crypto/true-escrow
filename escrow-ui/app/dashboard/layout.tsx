"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type BadgeState = { pendingApprovals: number; myTasks: number; finalApprovalWaiting: number; inviteCount: number };

const GROUPS: Array<{
  title: string;
  items: Array<{ href: string; label: string; badge?: keyof BadgeState }>;
}> = [
  {
    title: "Dashboard",
    items: [{ href: "/dashboard", label: "Overview" }],
  },
  {
    title: "Trade Management",
    items: [
      { href: "/dashboard/trade-management/created", label: "Created by Me" },
      { href: "/dashboard/trade-management/participating", label: "Participating" },
      { href: "/dashboard/trade-management/all", label: "All Trades" },
    ],
  },
  {
    title: "Progress",
    items: [
      { href: "/dashboard/progress/active", label: "Active" },
      { href: "/dashboard/progress/completed", label: "Completed" },
      { href: "/dashboard/progress/disputed", label: "Disputed/On Hold" },
    ],
  },
  {
    title: "Approvals & Tasks",
    items: [
      { href: "/dashboard/approvals/pending", label: "Pending Approvals", badge: "pendingApprovals" },
      { href: "/dashboard/approvals/my-tasks", label: "My Tasks", badge: "myTasks" },
      { href: "/dashboard/approvals/final-waiting", label: "Final Approval Waiting", badge: "finalApprovalWaiting" },
    ],
  },
  {
    title: "Invitations",
    items: [
      { href: "/dashboard/invitations/received", label: "Received Invites", badge: "inviteCount" },
      { href: "/dashboard/invitations/sent", label: "Sent Invites" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<BadgeState>({
    pendingApprovals: 0,
    myTasks: 0,
    finalApprovalWaiting: 0,
    inviteCount: 0,
  });

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard/counts", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setBadges(
        json?.ok
          ? {
              pendingApprovals: Number(json.data?.pendingApprovals ?? 0),
              myTasks: Number(json.data?.myTasks ?? 0),
              finalApprovalWaiting: Number(json.data?.finalApprovalWaiting ?? 0),
              inviteCount: Number(json.data?.inviteCount ?? 0),
            }
          : { pendingApprovals: 0, myTasks: 0, finalApprovalWaiting: 0, inviteCount: 0 }
      );
    })();
  }, [pathname]);

  const isActive = useMemo(() => (href: string) => pathname === href, [pathname]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-4 p-4">
        <aside className="bg-white border rounded-xl p-3 h-fit">
          <div className="mb-3">
            <Link href="/transactions/new" className="block text-center px-3 py-2.5 rounded-md bg-blue-600 text-white text-sm font-semibold">
              Create Transaction
            </Link>
          </div>
          <nav className="space-y-3">
            {GROUPS.map((g) => (
              <div key={g.title} className="border border-gray-100 rounded-lg p-2">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-500 px-2 mb-1.5">{g.title}</div>
                <div className="space-y-1">
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-md text-[15px] leading-5 min-h-[44px] ${
                        isActive(item.href)
                          ? "bg-blue-100 text-blue-800 font-semibold"
                          : "text-gray-700 font-medium hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="text-xs rounded-full bg-gray-200 px-2 py-0.5 min-w-[24px] text-center">{badges[item.badge]}</span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <section className="bg-white border rounded-xl p-4 min-h-[400px]">{children}</section>
      </div>
    </main>
  );
}
