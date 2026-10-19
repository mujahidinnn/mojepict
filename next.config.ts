import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { CONVERTER_LEGACY } from "./lib/converter-formats";
import { HUB_MODES } from "./lib/hubs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // ponytail: the dev disk cache grew to 5GB+ with long compactions on a low-RAM machine; re-enable for faster cold starts if disk/RAM allow.
    turbopackFileSystemCacheForDev: false,
  },
  // No COEP/COOP/strict CSP: they would break wasm workers, CDN-hosted models and map tiles.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self)" },
        ],
      },
    ];
  },
  // Tools merged into hubs keep working: old slug -> hub with the mode preselected.
  async redirects() {
    const toHub = Object.entries(HUB_MODES).flatMap(([hub, modes]) =>
      modes
        .filter((mode) => mode !== hub)
        .map((mode) => ({ source: `/${mode}`, destination: `/${hub}?mode=${mode}`, permanent: true })),
    );
    const toConverter = Object.entries(CONVERTER_LEGACY).map(([slug, { from, to }]) => ({
      source: `/${slug}`,
      destination: `/converter?from=${from}&to=${to}`,
      permanent: true,
    }));
    return [...toHub, ...toConverter];
  },
};

// Run `ANALYZE=true yarn build` to inspect per-route bundle composition.
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
