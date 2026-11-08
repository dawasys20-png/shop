import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogPage } from "../../components/catalog-page";
import { getCategory, products } from "../../lib/products";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <CatalogPage title="All supplements" products={products} initialCategory="all" />
      }
    >
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
  const category = getCategory(slug);
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
