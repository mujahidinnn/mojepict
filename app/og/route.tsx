import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { OgIcon } from "@/lib/og-icon";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

const fontsPromise = Promise.all([
  fetch(new URL("./Geist-Regular.ttf", import.meta.url)).then((res) =>
    res.arrayBuffer(),
  ),
  fetch(new URL("./Geist-Bold.ttf", import.meta.url)).then((res) =>
    res.arrayBuffer(),
  ),
]);

function bufferToBase64(buf: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const logoDataUriPromise = fetch(
  new URL("./mojepict-logo.png", import.meta.url),
)
  .then((res) => res.arrayBuffer())
  .then((buf) => `data:image/png;base64,${bufferToBase64(buf)}`);

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
  image: {
    from: "#3b82f6",
    to: "#2563eb",
    glow: "59,130,246",
    accent: "#60a5fa",
  },
  pdf: { from: "#ef4444", to: "#e11d48", glow: "239,68,68", accent: "#f87171" },
  unit: {
    from: "#8b5cf6",
    to: "#7c3aed",
    glow: "139,92,246",
    accent: "#a78bfa",
  },
  color: {
    from: "#ec4899",
    to: "#e11d48",
    glow: "236,72,153",
    accent: "#f472b6",
  },
  text: {
    from: "#fbbf24",
    to: "#f97316",
    glow: "251,191,36",
    accent: "#fcd34d",
  },
  math: {
    from: "#10b981",
    to: "#0d9488",
    glow: "16,185,129",
    accent: "#34d399",
  },
  dev: {
    from: "#64748b",
    to: "#334155",
    glow: "100,116,139",
    accent: "#94a3b8",
  },
  productivity: {
    from: "#06b6d4",
    to: "#0284c7",
    glow: "6,182,212",
    accent: "#22d3ee",
  },
};

const DEFAULT_ACCENT = "#2dd4bf";

function getBackgroundImage(
  theme: (typeof CATEGORY_THEME)[string] | undefined,
) {
  if (theme) {
    return [
      `radial-gradient(620px circle at 12% 15%, rgba(${theme.glow},0.35), transparent 70%)`,
      `radial-gradient(560px circle at 90% 92%, rgba(${theme.glow},0.22), transparent 70%)`,
      "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
    ].join(", ");
  }
  // Homepage / no category: the same multi-hue glow as the dashboard hero.
  return [
    "radial-gradient(700px circle at 10% 10%, rgba(99,102,241,0.46), transparent 72%)",
    "radial-gradient(640px circle at 90% 20%, rgba(236,72,153,0.4), transparent 72%)",
    "radial-gradient(680px circle at 25% 90%, rgba(245,158,11,0.36), transparent 72%)",
    "radial-gradient(640px circle at 85% 95%, rgba(16,185,129,0.36), transparent 72%)",
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
  const [geistRegular, geistBold] = await fontsPromise;
  const logoDataUri = await logoDataUriPromise;

  return new ImageResponse(
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
        fontFamily: "Geist, Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {iconName ? (
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
                <img src={logoDataUri} width={52} height={52} />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                color: "#e5e7eb",
              }}
            >
              Mojepict
            </div>
          </div>
        ) : (
          <div />
        )}
        <div style={{ display: "flex", fontSize: 26, color: "#94a3b8" }}>
          mojepict.vercel.app
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 152,
            height: 152,
            borderRadius: 38,
            background: theme
              ? `linear-gradient(135deg, ${theme.from}, ${theme.to})`
              : "#ffffff",
            marginRight: 48,
            flexShrink: 0,
            overflow: "hidden",
            boxShadow: theme
              ? `0 20px 60px -20px rgba(${theme.glow},0.6)`
              : "0 20px 60px -20px rgba(0,0,0,0.5)",
          }}
        >
          {iconName ? (
            <OgIcon name={iconName} color="#ffffff" size={78} strokeWidth={2} />
          ) : (
            <img src={logoDataUri} width={152} height={152} />
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
                fontSize: 30,
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
              fontSize: 84,
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
              fontSize: 40,
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
          fontSize: 28,
          color: "#cbd5e1",
        }}
      >
        No Uploads · No Accounts · 100% Browser-Based
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Geist", data: geistRegular, weight: 400, style: "normal" },
        { name: "Geist", data: geistBold, weight: 600, style: "normal" },
        { name: "Geist", data: geistBold, weight: 700, style: "normal" },
        { name: "Geist", data: geistBold, weight: 800, style: "normal" },
      ],
    },
  );
}
