"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// `beforeinstallprompt` fires once per load, so it's captured by PwaRegister
// (always mounted in the root layout) and shared with every install button.
let installEvent: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const setInstallEvent = (e: BeforeInstallPromptEvent | null) => {
  installEvent = e;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Registers the service worker and captures the install prompt; render once in the root layout. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}

export function InstallPwaButton() {
  const { t } = useI18n();
  const event = useSyncExternalStore(
    subscribe,
    () => installEvent,
    () => null,
  );

  // Browsers don't fire beforeinstallprompt once installed, so no standalone check is needed.
  if (!event) return null;

  const handleInstall = async () => {
    await event.prompt();
    await event.userChoice;
    setInstallEvent(null);
  };

  return (
    <>
      <span className="text-muted-foreground/40">·</span>
      <Button
        type="button"
        variant="link"
        onClick={handleInstall}
        aria-label={t("nav.installApp")}
        className="h-auto gap-1 p-0 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:no-underline [&_svg]:size-3"
      >
        <Download />
        {t("nav.installApp")}
      </Button>
    </>
  );
}
