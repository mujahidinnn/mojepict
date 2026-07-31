import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${SITE_URL}/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: tool.featured ? 0.9 : 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...toolEntries,
  ];
}
