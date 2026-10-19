"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The palette pulls in both dictionaries and cmdk; load it on first use only.
const CommandPalette = dynamic(
  () => import("@/components/layout/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function CommandPaletteLoader() {
  const [query, setQuery] = useState<string | null>(null);

  useEffect(() => {
    if (query !== null) return;
    const open = () => setQuery("");
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open();
      }
    };
    // WebSite SearchAction target: /?q=<term> opens the palette prefilled.
    const q = new URLSearchParams(window.location.search).get("q");
    if (window.location.pathname === "/" && q) setQuery(q);
    document.addEventListener("keydown", down);
    window.addEventListener("mojepict:open-palette", open);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("mojepict:open-palette", open);
    };
  }, [query]);

  return query === null ? null : <CommandPalette defaultQuery={query} />;
}
