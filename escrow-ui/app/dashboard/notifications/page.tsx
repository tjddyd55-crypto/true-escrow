"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  tradeId: string;
  blockId?: string | null;
  conditionId?: string | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function DashboardNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setItems(res.ok && json.ok ? (json.data as NotificationItem[]) : []);
      setLoading(false);
    })();
  }, []);

  async function markAllAsRead() {
    setMarking(true);
    const res = await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    }
    setMarking(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        <button
          type="button"
          className="text-sm px-3 py-1.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-60"
          onClick={markAllAsRead}
          disabled={marking || items.length === 0}
        >
          {marking ? "처리 중..." : "모두 읽음"}
        </button>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading...</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-gray-500">알림이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="border rounded p-3 bg-white">
              <div className="text-xs text-gray-500">{item.type}</div>
              <div className="text-sm font-medium">{item.message}</div>
              <div className="text-xs text-gray-500 mt-1">
                trade: {item.tradeId} {item.blockId ? `/ block: ${item.blockId}` : ""} / {item.createdAt}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
