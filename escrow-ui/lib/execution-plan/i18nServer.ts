/**
 * Server-side i18n for PDF (same keys as client tKey).
 * Preview와 PDF 문구 1:1 동일.
 */

import { en } from "@/lib/i18n/en";
import { ko } from "@/lib/i18n/ko";

export type DocLang = "ko" | "en";

const dictionaries: Record<DocLang, Record<string, unknown>> = { en, ko };

function getByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const k of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[k];
  }
  return typeof current === "string" ? current : undefined;
}

/** Resolve i18n key to string. Same logic as client tKey. */
export function translate(lang: DocLang, key: string): string {
  const dict = dictionaries[lang] ?? dictionaries.ko;
  return getByPath(dict as Record<string, unknown>, key) ?? key;
}
