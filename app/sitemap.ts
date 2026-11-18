import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublicSiteUrl, getServerProducts } from "./lib/server-products";

function escapeXml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) {
    console.error(
      "NEXT_PUBLIC_SITE_URL is not set; product URLs cannot be added to the sitemap.",
    );
    return [];
  }

  const products = await getServerProducts();
  return [
    { url: escapeXml(siteUrl.toString()), changeFrequency: "weekly", priority: 1 },
    { url: escapeXml(new URL("/shop", siteUrl).toString()), changeFrequency: "daily", priority: 0.9 },
    ...products.map((product) => ({
      url: escapeXml(new URL(`/products/${encodeURIComponent(product.id)}`, siteUrl).toString()),
      images: [
        ...new Set(
          product.variants
            .flatMap((variant) => variant.images.map(({ url }) => url))
            .map(escapeXml),
        ),
      ],
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
