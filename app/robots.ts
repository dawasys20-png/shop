import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "./lib/server-products";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/delivery", "/cart", "/checkout", "/login", "/signup", "/orders"],
    },
    ...(siteUrl ? { sitemap: new URL("/sitemap.xml", siteUrl).toString() } : {}),
  };
}
