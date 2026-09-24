import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { CONVERTER_LEGACY } from "./lib/converter-formats";
import { HUB_MODES } from "./lib/hubs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
