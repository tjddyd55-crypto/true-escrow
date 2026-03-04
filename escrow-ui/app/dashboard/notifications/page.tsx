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

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch("/api/dashboard/notifications", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setItems(res.ok && json.ok ? (json.data as NotificationItem[]) : []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">Notifications</h1>
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
