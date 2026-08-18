import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { OgIcon } from "@/lib/og-icon";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

function clamp(value: string | null, max: number) {
  return (value ?? "").slice(0, max);
}

/**
 * Mirrors CATEGORY_COLORS in lib/tool-icons.tsx (Tailwind classes there
 * can't be used inside next/og, so the same palette is repeated as hex).
 */
const CATEGORY_THEME: Record<
  string,
  { from: string; to: string; glow: string; accent: string }
> = {
  image: { from: "#3b82f6", to: "#2563eb", glow: "59,130,246", accent: "#93c5fd" },
  pdf: { from: "#ef4444", to: "#e11d48", glow: "239,68,68", accent: "#fca5a5" },
  unit: { from: "#8b5cf6", to: "#7c3aed", glow: "139,92,246", accent: "#c4b5fd" },
  color: { from: "#ec4899", to: "#e11d48", glow: "236,72,153", accent: "#f9a8d4" },
  text: { from: "#fbbf24", to: "#f97316", glow: "251,191,36", accent: "#fde68a" },
  math: { from: "#10b981", to: "#0d9488", glow: "16,185,129", accent: "#6ee7b7" },
  dev: { from: "#64748b", to: "#334155", glow: "100,116,139", accent: "#cbd5e1" },
};

const DEFAULT_ACCENT = "#5eead4";

function getBackgroundImage(theme: (typeof CATEGORY_THEME)[string] | undefined) {
  if (theme) {
    return [
      `radial-gradient(620px circle at 12% 15%, rgba(${theme.glow},0.35), transparent 70%)`,
      `radial-gradient(560px circle at 90% 92%, rgba(${theme.glow},0.22), transparent 70%)`,
      "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
    ].join(", ");
  }
  // Homepage / no category: the same multi-hue glow as the dashboard hero.
  return [
    "radial-gradient(700px circle at 10% 10%, rgba(99,102,241,0.38), transparent 72%)",
    "radial-gradient(640px circle at 90% 20%, rgba(236,72,153,0.32), transparent 72%)",
    "radial-gradient(680px circle at 25% 90%, rgba(245,158,11,0.28), transparent 72%)",
    "radial-gradient(640px circle at 85% 95%, rgba(16,185,129,0.28), transparent 72%)",
    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
  ].join(", ");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = clamp(searchParams.get("title"), 60) || "Mojepict";
  const subtitle =
    clamp(searchParams.get("subtitle"), 100) || "Free tools that just work.";
  const eyebrow = clamp(searchParams.get("eyebrow"), 40);
  const categoryKey = clamp(searchParams.get("category"), 20);
  const iconName = clamp(searchParams.get("icon"), 40);

  const theme = CATEGORY_THEME[categoryKey];
  const accent = theme?.accent ?? DEFAULT_ACCENT;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 90px",
          background: "#0b0d12",
          backgroundImage: getBackgroundImage(theme),
          backgroundSize: theme
            ? "auto, auto, 40px 40px, 40px 40px"
            : "auto, auto, auto, auto, 40px 40px, 40px 40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#ffffff",
                marginRight: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0b0d12",
                }}
              >
                M
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                color: "#e5e7eb",
              }}
            >
              Mojepict
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 20, color: "#6b7280" }}>
            mojepict.vercel.app
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 128,
              height: 128,
              borderRadius: 32,
              background: theme
                ? `linear-gradient(135deg, ${theme.from}, ${theme.to})`
                : "linear-gradient(135deg, #6366f1, #2563eb)",
              marginRight: 48,
              flexShrink: 0,
              boxShadow: `0 20px 60px -20px rgba(${theme?.glow ?? "99,102,241"},0.6)`,
            }}
          >
            {iconName ? (
              <OgIcon name={iconName} color="#ffffff" size={64} strokeWidth={2} />
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                M
              </div>
            )}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}
          >
            {eyebrow ? (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  fontSize: 24,
                  fontWeight: 700,
                  color: accent,
                  letterSpacing: 1,
                  marginBottom: 14,
                  padding: "6px 18px",
                  borderRadius: 999,
                  background: `rgba(${theme?.glow ?? "94,234,212"},0.15)`,
                }}
              >
                {eyebrow.toUpperCase()}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontSize: 66,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 600,
                color: accent,
                marginTop: 22,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#9ca3af",
          }}
        >
          No Uploads · No Accounts · 100% Browser-Based
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
