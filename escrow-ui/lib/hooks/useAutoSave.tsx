"use client";

import React, { useState, useCallback } from "react";

export type SaveStatus = "IDLE" | "SAVING" | "SAVED" | "ERROR";

const SAVED_RESET_MS = 1500;
const ERROR_RESET_MS = 2000;

/**
 * Single-field auto-save: onBlur only. Use for Transaction title/description.
 */
export function useAutoSave() {
  const [status, setStatus] = useState<SaveStatus>("IDLE");

  const triggerSave = useCallback(async (saveFn: () => Promise<void>) => {
    try {
      setStatus("SAVING");
      await saveFn();
      setStatus("SAVED");
      setTimeout(() => setStatus("IDLE"), SAVED_RESET_MS);
    } catch {
      setStatus("ERROR");
      setTimeout(() => setStatus("IDLE"), ERROR_RESET_MS);
    }
  }, []);

  return { status, triggerSave };
}

/**
 * Keyed auto-save: one status per key (e.g. block.id, rule.id).
 */
export function useAutoSaveByKey() {
  const [statusByKey, setStatusByKey] = useState<Record<string, SaveStatus>>({});

  const getStatus = useCallback((key: string): SaveStatus => {
    return statusByKey[key] ?? "IDLE";
  }, [statusByKey]);

  const triggerSave = useCallback(async (key: string, saveFn: () => Promise<void>) => {
    try {
      setStatusByKey((prev) => ({ ...prev, [key]: "SAVING" }));
      await saveFn();
      setStatusByKey((prev) => ({ ...prev, [key]: "SAVED" }));
      setTimeout(() => {
        setStatusByKey((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, SAVED_RESET_MS);
    } catch {
      setStatusByKey((prev) => ({ ...prev, [key]: "ERROR" }));
      setTimeout(() => {
        setStatusByKey((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, ERROR_RESET_MS);
    }
  }, []);

  return { getStatus, triggerSave };
}

const statusStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  transition: "opacity 0.2s",
};

export function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "IDLE") return null;
  const label =
    status === "SAVING"
      ? "Saving…"
      : status === "SAVED"
        ? "Saved"
        : "Failed to save";
  const icon = status === "SAVING" ? "⏳" : status === "SAVED" ? "✅" : "⚠️";
  return (
    <span style={statusStyle} role="status" aria-live="polite">
      {icon} {label}
    </span>
  );
}
