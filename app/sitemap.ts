import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { SITE_URL } from "@/lib/seo";

// Bump when the about/privacy copy changes.
const PAGES_UPDATED = "2026-10-19";
const LATEST_TOOL = TOOLS.reduce((max, tool) => (tool.createdAt > max ? tool.createdAt : max), "");

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${SITE_URL}/${tool.slug}`,
    lastModified: tool.createdAt,
    changeFrequency: "monthly",
    priority: tool.featured ? 0.9 : 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: LATEST_TOOL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: PAGES_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: PAGES_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...toolEntries,
  ];
}
