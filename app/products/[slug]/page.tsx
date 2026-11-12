import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductDetail } from "../../components/product-detail";
import {
  findProductVariant,
  getProductVariants,
  getStartingVariant,
} from "../../lib/products";
import { getServerProduct } from "../../lib/server-products";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}): Promise<Metadata> {
  const [{ slug }, { variant: requestedVariant }] = await Promise.all([
    params,
    searchParams,
  ]);
  const product = await getServerProduct(slug);
  const variants = product ? getProductVariants(product) : [];
  const variantId = Array.isArray(requestedVariant)
    ? requestedVariant[0]
    : requestedVariant;
  const startingVariant =
    findProductVariant(variants, variantId) ??
    (product ? getStartingVariant(product) : undefined);
  const description =
    startingVariant?.description?.replace(/\s+/g, " ").trim().slice(0, 300) ||
    `${product?.name ?? "Thoughtful supplements"} from ${product?.brand ?? "Form & Function"}. Explore product details and shop online.`;
  const image = startingVariant?.images[0]?.url;

  return {
    title: product
      ? `${product.name} | ${product.brand} | Form & Function`
      : "Supplement | Form & Function",
    description,
    robots: { index: Boolean(product), follow: true },
    alternates: product ? { canonical: `/products/${encodeURIComponent(slug)}` } : undefined,
    openGraph: {
      type: "website",
      title: product ? `${product.name} | ${product.brand}` : "Supplements | Form & Function",
      description,
      url: `/products/${encodeURIComponent(slug)}`,
      ...(image ? { images: [{ url: image, alt: startingVariant?.alt || product?.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product ? `${product.name} | ${product.brand}` : "Supplements | Form & Function",
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <main className={`detail-page [width:min(100%_-_104px,_1440px)] [min-height:75vh] [margin:0_auto] [padding:34px_0_100px] max-[900px]:[width:calc(100%_-_56px)] max-[600px]:[width:calc(100%_-_36px)] max-[600px]:[padding-top:18px] max-[600px]:[padding-bottom:70px]`}>
          <p className={`cart-page-loading [padding:48px_0] [color:#6b7280] [font-size:15px]`} role="status">Loading product…</p>
        </main>
      }
    >
      <ProductResults params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductResults({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}) {
  const [{ slug }, { variant }] = await Promise.all([params, searchParams]);
  const initialVariantId = Array.isArray(variant) ? variant[0] : variant;

  const product = await getServerProduct(slug);
  const productVariant = product
    ? findProductVariant(getProductVariants(product), initialVariantId) ??
      getStartingVariant(product)
    : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const productUrl = siteUrl
    ? new URL(`/products/${encodeURIComponent(slug)}`, siteUrl).toString()
    : undefined;
  const structuredData = product && productVariant
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: productVariant.description || `${product.name} by ${product.brand}.`,
        sku: productVariant.id,
        brand: { "@type": "Brand", name: product.brand },
        category: product.category,
        image: productVariant.images.map(({ url }) =>
          productUrl ? new URL(url, productUrl).toString() : url,
        ),
        offers: {
          "@type": "Offer",
          price: productVariant.price,
          priceCurrency: "UGX",
          ...(productUrl ? { url: productUrl } : {}),
        },
      }
    : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ProductDetail
        key={`${slug}:${productVariant?.id ?? ""}`}
        product={product}
        productId={slug}
        initialVariantId={productVariant?.id}
      />
    </>
  );
}
