"use client";

import { useEffect, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Check, ExternalLink, Search, Shield, X } from "lucide-react";

interface LighthouseScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

interface SecurityTest {
  title: string;
  pass: boolean;
  description: string;
}

interface SecurityResult {
  grade: string;
  score: number;
  testsPassed: number;
  testsFailed: number;
  tests: SecurityTest[];
}

const PSI_KEY_STORAGE = "mojepict:psi-api-key";

function scoreTone(score: number) {
  if (score >= 90) return "text-emerald-500 bg-emerald-500/10";
  if (score >= 50) return "text-amber-500 bg-amber-500/10";
  return "text-destructive bg-destructive/10";
}

function gradeTone(grade: string) {
  if (grade.startsWith("A")) return "text-emerald-500 bg-emerald-500/10";
  if (grade.startsWith("B") || grade.startsWith("C")) return "text-amber-500 bg-amber-500/10";
  return "text-destructive bg-destructive/10";
}

function ScoreTile({ label, score }: { label: string; score: number | null }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-4 text-center">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold",
          score == null ? "bg-muted text-muted-foreground" : scoreTone(score),
        )}
      >
        {score ?? "–"}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </Card>
  );
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function WebsiteScoreCheckerPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [lighthouse, setLighthouse] = useState<LighthouseScores | null>(null);
  const [lighthouseError, setLighthouseError] = useState<string | null>(null);
  const [security, setSecurity] = useState<SecurityResult | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PSI_KEY_STORAGE);
      if (saved) setApiKey(saved);
    } catch {
      // localStorage can throw in private browsing - the key input still works, it just won't persist.
    }
  }, []);

  const saveKey = (key: string) => {
    setApiKey(key);
    try {
      if (key) localStorage.setItem(PSI_KEY_STORAGE, key);
      else localStorage.removeItem(PSI_KEY_STORAGE);
    } catch {
      // see above
    }
  };

  const runCheck = async () => {
    if (!url.trim()) return;
    const target = normalizeUrl(url);
    let hostname: string;
    try {
      hostname = new URL(target).hostname;
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("tool.website-score-checker.invalidUrl") });
      return;
    }

    setLoading(true);
    setLighthouse(null);
    setLighthouseError(null);
    setSecurity(null);
    setSecurityError(null);

    const psiParams = new URLSearchParams({ url: target, strategy: "mobile" });
    ["performance", "accessibility", "best-practices", "seo"].forEach((c) => psiParams.append("category", c));
    if (apiKey) psiParams.set("key", apiKey);

    const [psiResult, obsResult] = await Promise.allSettled([
      fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${psiParams}`).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error?.message || "PageSpeed Insights request failed.");
        return data;
      }),
      fetch(`https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=${encodeURIComponent(hostname)}`).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "HTTP Observatory request failed.");
        return data;
      }),
    ]);

    if (psiResult.status === "fulfilled") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cats = (psiResult.value as any)?.lighthouseResult?.categories ?? {};
      const pct = (c: { score?: number } | undefined) => (c?.score != null ? Math.round(c.score * 100) : null);
      setLighthouse({
        performance: pct(cats.performance),
        accessibility: pct(cats.accessibility),
        bestPractices: pct(cats["best-practices"]),
        seo: pct(cats.seo),
      });
    } else {
      setLighthouseError(psiResult.reason instanceof Error ? psiResult.reason.message : String(psiResult.reason));
    }

    if (obsResult.status === "fulfilled") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = obsResult.value as any;
      const scan = value.scan;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tests = Object.values(value.tests ?? {}) as any[];
      setSecurity({
        grade: scan.grade,
        score: scan.score,
        testsPassed: scan.tests_passed,
        testsFailed: scan.tests_failed,
        tests: tests
          .filter((test) => test.pass !== null && test.pass !== undefined)
          .map((test) => ({ title: test.title as string, pass: !!test.pass, description: (test.score_description as string)?.replace(/<[^>]+>/g, "").trim() })),
      });
    } else {
      setSecurityError(obsResult.reason instanceof Error ? obsResult.reason.message : String(obsResult.reason));
    }

    setLoading(false);
  };

  return (
    <ToolShell title={t("tool.website-score-checker.name")} description={t("tool.website-score-checker.description")}>
      <div className="max-w-screen-lg flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCheck()}
            placeholder="example.com"
            className="flex-1"
          />
          <Button onClick={runCheck} disabled={!url.trim() || loading} className="gap-2 sm:w-auto">
            <Search className="h-4 w-4" />
            {loading ? t("state.converting") : t("tool.website-score-checker.check")}
          </Button>
        </div>

        <details className="rounded-lg border bg-muted/10 p-3 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground">{t("tool.website-score-checker.apiKeyLabel")}</summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">{t("tool.website-score-checker.apiKeyHint")}</p>
            <Input
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
              placeholder={t("tool.website-score-checker.apiKeyPlaceholder")}
              type="password"
            />
            <a
              href="https://developers.google.com/speed/docs/insights/v5/get-started"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {t("tool.website-score-checker.apiKeyGet")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </details>

        {loading && <Progress value={undefined} className="h-1.5 animate-pulse" />}

        {(lighthouse || lighthouseError) && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("tool.website-score-checker.lighthouse")}
            </Label>
            {lighthouseError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {lighthouseError}
              </p>
            ) : (
              lighthouse && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ScoreTile label={t("tool.website-score-checker.performance")} score={lighthouse.performance} />
                  <ScoreTile label={t("tool.website-score-checker.accessibility")} score={lighthouse.accessibility} />
                  <ScoreTile label={t("tool.website-score-checker.bestPractices")} score={lighthouse.bestPractices} />
                  <ScoreTile label={t("tool.website-score-checker.seo")} score={lighthouse.seo} />
                </div>
              )
            )}
          </div>
        )}

        {(security || securityError) && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("tool.website-score-checker.security")}
            </Label>
            {securityError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {securityError}
              </p>
            ) : (
              security && (
                <>
                  <Card className="flex items-center gap-4 p-4">
                    <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold", gradeTone(security.grade))}>
                      {security.grade}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">
                        {t("tool.website-score-checker.securityScore")
                          .replace("{{score}}", String(security.score))
                          .replace("{{passed}}", String(security.testsPassed))
                          .replace("{{total}}", String(security.testsPassed + security.testsFailed))}
                      </span>
                    </div>
                  </Card>
                  <div className="space-y-1.5">
                    {security.tests.map((test) => (
                      <div key={test.title} className="flex items-start gap-2 rounded-lg border bg-muted/10 p-2.5 text-sm">
                        {test.pass ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">{test.title}</p>
                          {test.description && <p className="text-xs text-muted-foreground">{test.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
