import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/lib/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getCanonicalSiteUrl().replace(/\/+$/, "");
  const now = new Date();

  const routes = [
    "",
    "/login",
    "/register",
    "/tutorial",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/legal",
    "/legal/cookies",
    "/legal/disclaimer",
    "/legal/gdpr",
    "/legal/invoices",
  ];

  return routes.map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: now,
    changeFrequency: p ? "weekly" : "daily",
    priority: p ? 0.7 : 1,
  }));
}
