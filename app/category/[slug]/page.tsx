import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BrandLoading } from "../../components/brand-loading";
import { CatalogPage } from "../../components/catalog-page";
import { getCategory } from "../../lib/products";
import { getServerProducts } from "../../lib/server-products";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<BrandLoading />}>
      <CategoryResults params={params} />
    </Suspense>
  );
}

async function CategoryResults({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getServerProducts();
  const category = getCategory(slug, products);
  if (!category || category.slug === "all") notFound();

  return (
    <CatalogPage
      key={slug}
      title={`${category.name} supplements`}
      products={products}
      initialCategory={slug}
    />
  );
}
