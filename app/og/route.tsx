import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

function clamp(value: string | null, max: number) {
  return (value ?? "").slice(0, max);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = clamp(searchParams.get("title"), 60) || "Mojepict";
  const subtitle =
    clamp(searchParams.get("subtitle"), 100) || "Free tools that just work.";
  const eyebrow = clamp(searchParams.get("eyebrow"), 40);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          background: "#0b0d12",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#ffffff",
              marginRight: 40,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 40,
                fontWeight: 800,
                color: "#0b0d12",
              }}
            >
              M
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {eyebrow ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 600,
                  color: "#5eead4",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                {eyebrow.toUpperCase()}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontSize: 68,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 600,
            color: "#5eead4",
            marginTop: 36,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#9ca3af",
            marginTop: 24,
          }}
        >
          No Uploads · No Accounts · 100% Browser-Based
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
