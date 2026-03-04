"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TradeDetailPage from "@/app/trades/[tradeId]/page";

type StepperStatus = "DRAFT" | "ACTIVE" | "IN_PROGRESS" | "READY_FOR_FINAL_APPROVAL" | "COMPLETED";
type SummaryActionType = "TASK" | "APPROVAL" | "FINAL";
type TradeSummary = {
  trade: { id: string; title: string; status: string; kind: "MVP" | "ENGINE" };
  participantRole: "BUYER" | "SELLER" | "VERIFIER" | null;
  stepperStatus: StepperStatus;
  blocks: Array<{
    id: string;
    title: string;
    dueDate: string;
    extendedDueDate: string | null;
    status: string;
    requiredCount: number;
    confirmedCount: number;
    submittedCount: number;
    rejectedCount: number;
    progressPct: number;
  }>;
  myNextActions: Array<{
    type: SummaryActionType;
    blockId: string;
    conditionId?: string;
    title: string;
    dueDate: string | null;
  }>;
};
type EventItem = {
  id: string;
  eventType: string;
  createdAt: string;
};

const STEPS: StepperStatus[] = ["DRAFT", "ACTIVE", "IN_PROGRESS", "READY_FOR_FINAL_APPROVAL", "COMPLETED"];

function StatusStepper({ current }: { current: StepperStatus }) {
  const currentIndex = STEPS.indexOf(current);
  return (
    <div className="border rounded-lg p-4 bg-white">
      <h2 className="font-semibold mb-3">거래 진행 상태</h2>
      <div className="hidden md:flex items-center gap-2">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div key={step} className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-semibold ${
                  done
                    ? "bg-green-600 text-white"
                    : active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? "✓" : index + 1}
              </div>
              <div className={`text-xs truncate ${active ? "text-blue-700 font-semibold" : done ? "text-green-700" : "text-gray-500"}`}>
                {step}
              </div>
              {index < STEPS.length - 1 ? <div className="h-px bg-gray-300 flex-1" /> : null}
            </div>
          );
        })}
      </div>
      <div className="md:hidden space-y-1">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div key={step} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${done ? "bg-green-600" : active ? "bg-blue-600" : "bg-gray-300"}`} />
              <span className={active ? "font-semibold text-blue-700" : done ? "text-green-700" : "text-gray-500"}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EngineSummaryPanel({ summary, events }: { summary: TradeSummary; events: EventItem[] }) {
  function focusAction(action: TradeSummary["myNextActions"][number]) {
    const targetId = action.conditionId ? `condition-${action.conditionId}` : `block-${action.blockId}`;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{summary.trade.title}</h1>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <StatusStepper current={summary.stepperStatus} />
        </div>
        <aside className="border rounded-lg p-4 bg-white lg:sticky lg:top-20 h-fit">
          <h2 className="font-semibold mb-2">📌 내가 지금 해야 할 일</h2>
          {summary.myNextActions.length === 0 ? (
            <p className="text-sm text-gray-500">현재 처리할 작업이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {summary.myNextActions.map((action, idx) => (
                <button
                  key={`${action.type}-${action.blockId}-${action.conditionId ?? idx}`}
                  type="button"
                  className="w-full text-left border rounded p-2 hover:bg-gray-50"
                  onClick={() => focusAction(action)}
                >
                  <div className="text-xs text-gray-500">{action.type}</div>
                  <div className="font-medium text-sm">{action.title}</div>
                  {action.dueDate ? <div className="text-xs text-gray-600">마감: {action.dueDate}</div> : null}
                </button>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="space-y-3">
        {summary.blocks.map((block) => (
          <article id={`block-${block.id}`} key={block.id} className="border rounded-lg p-4 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-gray-100">{block.status}</span>
              <span className="text-sm text-gray-600">Due Date: {block.dueDate}</span>
              {block.extendedDueDate ? <span className="text-sm text-red-600">연기됨: {block.extendedDueDate}</span> : null}
            </div>
            <div className="font-semibold">{block.title}</div>
            <div className="text-xs text-gray-600">
              Confirmed {block.confirmedCount} / Required {block.requiredCount} ({block.progressPct}%)
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-2 bg-green-500 rounded" style={{ width: `${block.progressPct}%` }} />
            </div>
            <div className="text-xs text-gray-500">
              SUBMITTED {block.submittedCount} / REJECTED {block.rejectedCount}
            </div>
          </article>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Activity Timeline</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">이벤트가 없습니다.</p>
        ) : (
          events.slice(0, 20).map((event) => (
            <div key={event.id} className="text-sm border rounded p-2 bg-white">
              <span className="font-medium">{event.eventType}</span>
              <span className="text-gray-500 text-xs ml-2">{event.createdAt}</span>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [resolved, setResolved] = useState(false);
  const [isMvpTrade, setIsMvpTrade] = useState(false);
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [kindRes, summaryRes, eventsRes] = await Promise.all([
        fetch(`/api/transactions/${id}`, { cache: "no-store" }),
        fetch(`/api/transactions/${id}/summary`, { cache: "no-store" }),
        fetch(`/api/transactions/${id}/events`, { cache: "no-store" }),
      ]);
      const kindJson = await kindRes.json().catch(() => ({}));
      const summaryJson = await summaryRes.json().catch(() => ({}));
      const eventsJson = await eventsRes.json().catch(() => ({}));
      if (!kindRes.ok) {
        setError(kindJson?.error ?? "거래 정보를 찾을 수 없습니다.");
        setResolved(true);
        return;
      }
      setIsMvpTrade(kindJson?.data?.kind === "MVP");
      setSummary(summaryRes.ok && summaryJson.ok ? (summaryJson.data as TradeSummary) : null);
      setEvents(eventsRes.ok && eventsJson.ok ? (eventsJson.data?.events as EventItem[]) ?? [] : []);
      setResolved(true);
    })();
  }, [id]);

  if (!resolved) return <main className="max-w-5xl mx-auto p-6">Loading...</main>;
  if (error) return <main className="max-w-5xl mx-auto p-6 text-red-600">{error}</main>;
  if (!isMvpTrade && summary) return <EngineSummaryPanel summary={summary} events={events} />;
  if (!isMvpTrade) return <main className="max-w-5xl mx-auto p-6">Loading...</main>;
  return <TradeDetailPage />;
}
