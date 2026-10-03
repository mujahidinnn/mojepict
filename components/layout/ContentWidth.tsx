"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SetFullWidthContext = createContext<((v: boolean) => void) | null>(null);

/**
 * Every tool page runs inside a max-w-6xl wrapper by default (comfortable
 * reading width for forms/calculators). A few tools are a big canvas/map/
 * workspace that wants the room instead - ToolShell's `fullWidth` prop lets
 * those opt out via `useFullWidthContent`, which reaches up to this
 * provider (rendered once in the root layout, above where pages render).
 */
export function ContentWidthProvider({ children }: { children: ReactNode }) {
  const [full, setFull] = useState(false);
  return (
    <SetFullWidthContext.Provider value={setFull}>
      <div className={full ? "mx-auto w-full" : "mx-auto max-w-6xl"}>{children}</div>
    </SetFullWidthContext.Provider>
  );
}

export function useFullWidthContent(enabled: boolean) {
  const setFull = useContext(SetFullWidthContext);
  useEffect(() => {
    if (!setFull || !enabled) return;
    setFull(true);
    return () => setFull(false);
  }, [enabled, setFull]);
}
