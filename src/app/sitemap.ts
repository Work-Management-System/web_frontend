import type { MetadataRoute } from "next";
import { seoConfig, sitemapRoutes } from "@/configs/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = seoConfig.baseUrl;
  const now = new Date();

  return sitemapRoutes.map((path) => ({
    url: path ? `${baseUrl}${path}` : baseUrl,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : ("monthly" as const),
    priority: path === "" ? 1 : 0.8,
  }));
}
