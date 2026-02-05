"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "./en";
import { ko } from "./ko";

type Language = "en" | "ko";

const dictionaries = { en, ko };

type I18nContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof en;
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

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
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
