"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { en, I18nKey } from "./en";
import { id } from "./id";

type Locale = "en" | "id";
const dictionaries = { en, id };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: I18nKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const t = (key: I18nKey): string => {
    const dict = dictionaries[locale] as Record<string, string>;
    return dict[key] ?? (en as Record<string, string>)[key] ?? key;
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
