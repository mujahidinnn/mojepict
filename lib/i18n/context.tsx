"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { en, I18nKey } from "./en";

type Locale = "en" | "id";
type Dict = Record<string, string>;
const STORAGE_KEY = "mojepict:locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: I18nKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR always renders "en"; the stored choice is applied after hydration.
  const [locale, setLocaleState] = useState<Locale>("en");
  // Only the default dictionary ships in the initial bundle; "id" loads on demand.
  const [idDict, setIdDict] = useState<Dict | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "id") setLocaleState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (locale === "id" && !idDict) import("./id").then((m) => setIdDict(m.id));
  }, [locale, idDict]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };

  const t = (key: I18nKey): string => {
    const dict = locale === "id" && idDict ? idDict : (en as Dict);
    return dict[key] ?? (en as Dict)[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
