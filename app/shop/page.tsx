import { Suspense } from "react";
import { CatalogLoading } from "../components/catalog-loading";
import { CatalogPage } from "../components/catalog-page";
import { getServerProducts } from "../lib/server-products";

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  return (
    <Suspense fallback={<CatalogLoading />}>
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
  const products = await getServerProducts();

  return (
    <CatalogPage
      key={query}
      title={query.trim() ? "Search results" : "All supplements"}
      products={products}
      initialQuery={query}
    />
  );
}
