"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-3 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("error.title")}</h1>
      <p className="text-sm text-muted-foreground max-w-prose">{t("error.description")}</p>
      <Button onClick={reset} className="mt-2">
        {t("error.retry")}
      </Button>
    </div>
  );
}
