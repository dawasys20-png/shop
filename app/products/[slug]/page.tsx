import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductDetail } from "../../components/product-detail";
import { getProduct, getStartingVariant, products } from "../../lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  const startingVariant = product ? getStartingVariant(product) : undefined;
  return {
    title: product ? `${product.name} — Form & Function` : "Supplement — Form & Function",
    description: startingVariant?.description,
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
  const product = getProduct(slug);
  const initialVariantId = Array.isArray(variant) ? variant[0] : variant;

  return (
    <ProductDetail
      key={`${slug}:${initialVariantId ?? ""}`}
      product={product ?? null}
      productId={slug}
      initialVariantId={initialVariantId}
    />
  );
}
