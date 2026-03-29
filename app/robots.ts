import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  const base = getCanonicalSiteUrl().replace(/\/+$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/admin/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
