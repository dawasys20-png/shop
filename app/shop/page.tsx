import { Suspense } from "react";
import { CatalogPage } from "../components/catalog-page";
import { products } from "../lib/products";

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  return (
    <Suspense fallback={<CatalogPage title="All supplements" products={products} initialQuery="" />}>
      <ShopResults searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopResults({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query = "" } = await searchParams;

  return (
    <CatalogPage
      key={query}
      title={query.trim() ? "Search results" : "All supplements"}
      products={products}
      initialQuery={query}
    />
  );
}
