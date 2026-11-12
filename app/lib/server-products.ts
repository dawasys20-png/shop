import "server-only";

import { cache } from "react";
import type { Product, ProductVariant } from "./products";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProduct(value: unknown): value is Product {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.brand !== "string" ||
    typeof value.category !== "string" ||
    !Array.isArray(value.variants) ||
    value.variants.length === 0
  ) {
    return false;
  }

  return value.variants.every(
    (variant): variant is ProductVariant =>
      isRecord(variant) &&
      typeof variant.id === "string" &&
      typeof variant.form === "string" &&
      typeof variant.potency === "string" &&
      typeof variant.packageQuantity === "string" &&
      typeof variant.price === "number" &&
      Number.isFinite(variant.price) &&
      Array.isArray(variant.images) &&
      variant.images.every(
        (image) => isRecord(image) && typeof image.url === "string",
      ),
  );
}

function getProductsUrl() {
  const configuredUrl =
    process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
  const apiBase = (configuredUrl || "http://localhost:4000/api").replace(/\/+$/, "");
  return `${apiBase}/products`;
}

export const getServerProducts = cache(async (): Promise<Product[]> => {
  const response = await fetch(getProductsUrl(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Product API returned HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (
    !isRecord(payload) ||
    !Array.isArray(payload.products) ||
    !payload.products.every(isProduct)
  ) {
    throw new Error("The product API returned an invalid catalog.");
  }
  return payload.products;
});

export async function getServerProduct(id: string) {
  const products = await getServerProducts();
  return products.find((product) => product.id === id) ?? null;
}

export function getPublicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("The site URL must use HTTP or HTTPS.");
    }
    return url;
  } catch (error) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) URL.",
      { cause: error },
    );
  }
}
