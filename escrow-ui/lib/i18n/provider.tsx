"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "./en";
import { ko } from "./ko";

type Language = "en" | "ko";

const dictionaries = { en, ko };

function getByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const k of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[k];
  }
  return typeof current === "string" ? current : undefined;
}

type I18nContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof en;
  /** Resolve i18n key (e.g. template.quick_delivery.title) to string. */
  tKey: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("i18n_lang") as Language | null;
      if (saved && (saved === "en" || saved === "ko")) {
        setLangState(saved);
      }
    }
  }, []);

  // Save language to localStorage when changed
  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("i18n_lang", newLang);
    }
  };

  const t = dictionaries[lang];
  const tKey = (key: string) => getByPath(t as Record<string, unknown>, key) ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tKey }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
