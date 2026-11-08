"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  categories,
  getProductVariants,
  type Product,
} from "../lib/products";
import { formatPrice } from "../lib/currency";
import { useCatalog } from "./catalog-context";
import { ProductGrid } from "./product-grid";

const chipBase =
  "inline-flex min-h-8 items-center rounded-full border px-3.5 text-[12.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355342]";
const chipOff =
  "border-[#dfe4d8] bg-white text-[#5f6b61] hover:border-[#9db0a0] hover:text-[#233b30]";
const chipOn = "border-[#355342] bg-[#355342] text-white";

export function CatalogPage({
  title,
  products,
  initialCategory = "all",
  initialQuery = "",
}: {
  title: string;
  products: Product[];
  initialCategory?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const { products: catalogProducts, ready: catalogReady } = useCatalog();
  const [query, setQuery] = useState(initialQuery);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryProducts = useMemo(
    () =>
      initialCategory === "all"
        ? catalogReady ? catalogProducts : products
        : (catalogReady ? catalogProducts : products).filter(
            (product) => product.category.toLowerCase() === initialCategory,
          ),
    [products, catalogProducts, catalogReady, initialCategory],
  );
  const brands = useMemo(
    () => [...new Set(categoryProducts.map((product) => product.brand))].sort(),
    [categoryProducts],
  );
  const maxAvailablePrice = useMemo(
    () =>
      Math.ceil(
        Math.max(
          ...categoryProducts.flatMap((product) =>
            getProductVariants(product).map(({ price }) => price),
          ),
          0,
        ) / 10,
      ) * 10,
    [categoryProducts],
  );
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const activeMaxPrice = maxPrice ?? maxAvailablePrice;
  const typeGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const product of categoryProducts) {
      const types = groups.get(product.category) ?? [];
      for (const type of getProductVariants(product)
        .map((variant) => variant.type)
        .filter((value): value is string => Boolean(value))) {
        if (!types.includes(type)) types.push(type);
      }
      groups.set(product.category, types);
    }
    return [...groups.entries()];
  }, [categoryProducts]);
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return categoryProducts.flatMap((product) => {
      const allVariants = getProductVariants(product);
      const sharedText = [
        product.name,
        product.category,
        product.brand,
      ].join(" ").toLowerCase();
      const matchesSharedText = sharedText.includes(normalizedQuery);
      const matchingVariants = allVariants.filter((variant) => {
        const searchableText = [
          variant.detail,
          variant.type,
          variant.tag,
          variant.description,
        ].join(" ").toLowerCase();
        const matchesQuery =
          !normalizedQuery || matchesSharedText || searchableText.includes(normalizedQuery);
        const matchesType =
          selectedTypes.length === 0 ||
          Boolean(variant.type && selectedTypes.includes(variant.type));
        const matchesPrice = variant.price <= activeMaxPrice;
        return matchesQuery && matchesType && matchesPrice;
      });
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      return matchesBrand && matchingVariants.length > 0
        ? [{ ...product, variants: matchingVariants }]
        : [];
    });
  }, [categoryProducts, query, selectedTypes, selectedBrands, activeMaxPrice]);

  const currentCategory = categories.find(
    (category) => category.slug === initialCategory,
  );
  const heading =
    initialCategory !== "all" && currentCategory
      ? `${currentCategory.name} supplements`
      : title;

  const hasPriceFilter = maxPrice !== null;
  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    selectedTypes.length +
    selectedBrands.length +
    (hasPriceFilter ? 1 : 0);

  function toggleType(type: string) {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    );
  }

  function toggleBrand(brand: string) {
    setSelectedBrands((current) =>
      current.includes(brand)
        ? current.filter((value) => value !== brand)
        : [...current, brand],
    );
  }

  function clearFilters() {
    setQuery("");
    setSelectedTypes([]);
    setSelectedBrands([]);
    setMaxPrice(null);
    router.push("/shop");
  }

  const sliderPercent =
    maxAvailablePrice > 0
      ? (Math.min(activeMaxPrice, maxAvailablePrice) / maxAvailablePrice) * 100
      : 100;

  return (
    <main className="mx-auto min-h-[65vh] w-[min(100%_-_104px,_1440px)] pb-28 pt-8 max-[900px]:w-[calc(100%_-_56px)] max-[600px]:w-[calc(100%_-_32px)] max-[600px]:pt-5">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-2 text-xs text-[#858b81]"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="transition-colors hover:text-[#355342]">
          Home
        </Link>
        <span aria-hidden="true">/</span>

        {initialCategory !== "all" && currentCategory ? (
          <>
            <Link
              href="/shop"
              className="transition-colors hover:text-[#355342]"
            >
              Shop
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-[#355342]" aria-current="page">
              {currentCategory.name}
            </span>
          </>
        ) : (
          <span className="font-medium text-[#355342]" aria-current="page">
            {heading}
          </span>
        )}
      </nav>

      {/* Page header */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-[#e3e7dd] pb-8 max-[600px]:mb-6 max-[600px]:pb-6">
        <div className="max-w-xl">
          <h1 className="mb-2 text-[40px] font-medium leading-[1.1] tracking-[-0.02em] text-[#233b30] max-[600px]:text-[30px]">
            {heading}
          </h1>
          <p className="mb-0 text-[15px] leading-6 text-[#6f7a70]">
            Find something that fits your routine.
          </p>
        </div>

        <p className="mb-0 text-sm text-[#6f7a70]" aria-live="polite">
          <span className="text-2xl font-medium tracking-tight text-[#233b30]">
            {visibleProducts.length}
          </span>{" "}
          {visibleProducts.length === 1 ? "product" : "products"}
        </p>
      </header>

      {/* Catalog layout */}
      <div className="grid grid-cols-[250px_minmax(0,1fr)] items-start gap-14 max-[1100px]:gap-10 max-[900px]:grid-cols-[210px_minmax(0,1fr)] max-[900px]:gap-7 max-[600px]:grid-cols-1 max-[600px]:gap-5">
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
          className="hidden min-h-11 items-center justify-between rounded-full border border-[#dfe4d8] bg-white px-5 text-sm font-medium text-[#233b30] max-[600px]:flex"
        >
          <span>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#355342] px-1.5 text-[11px] text-white">
                {activeFilterCount}
              </span>
            )}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Filters */}
        <aside
          id="catalog-filters"
          className={`sticky top-6 grid max-h-[calc(100vh_-_3rem)] gap-7 overflow-y-auto pb-2 pr-1 max-[600px]:static max-[600px]:max-h-none max-[600px]:overflow-visible ${
            filtersOpen ? "" : "max-[600px]:hidden"
          }`}
          aria-label="Product filters"
        >
          {/* Categories */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[#233b30]">
              Categories
            </h2>

            <ul className="m-0 grid list-none gap-0.5 p-0">
              {categories.map((category) => {
                const active = category.slug === initialCategory;

                return (
                  <li key={category.slug}>
                    <Link
                      href={
                        category.slug === "all"
                          ? "/shop"
                          : `/category/${category.slug}`
                      }
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-9 items-center gap-3 border-l-2 pl-3 text-[14px] transition-colors ${
                        active
                          ? "border-[#355342] font-semibold text-[#233b30]"
                          : "border-transparent text-[#6f7a70] hover:border-[#c9d3c6] hover:text-[#233b30]"
                      }`}
                    >
                      {category.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Product type */}
          <div className="border-t border-[#e3e7dd] pt-6">
            <h2 className="mb-4 text-sm font-semibold text-[#233b30]">
              Product type
            </h2>

            {typeGroups.map(([categoryName, types]) => (
              <fieldset
                key={categoryName}
                className="m-0 mb-5 border-0 p-0 last:mb-0"
              >
                {initialCategory === "all" ? (
                  <legend className="mb-2.5 p-0 text-xs text-[#858b81]">
                    {categoryName}
                  </legend>
                ) : (
                  <legend className="sr-only">{categoryName}</legend>
                )}

                <div className="flex flex-wrap gap-2">
                  {types.map((type) => {
                    const on = selectedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleType(type)}
                        className={`${chipBase} ${on ? chipOn : chipOff}`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          {/* Brand */}
          <div className="border-t border-[#e3e7dd] pt-6">
            <h2 className="mb-4 text-sm font-semibold text-[#233b30]">
              Brand
            </h2>

            <fieldset className="m-0 border-0 p-0">
              <legend className="sr-only">Filter by brand</legend>

              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => {
                  const on = selectedBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleBrand(brand)}
                      className={`${chipBase} ${on ? chipOn : chipOff}`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* Price */}
          <div className="border-t border-[#e3e7dd] pt-6">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="mb-0 text-sm font-semibold text-[#233b30]">
                Maximum price
              </h2>
              <span className="text-sm font-semibold text-[#355342]">
                {formatPrice(activeMaxPrice)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max={maxAvailablePrice || 10}
              step="1"
              value={Math.min(activeMaxPrice, maxAvailablePrice || 10)}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              aria-label="Maximum product price"
              style={{
                background: `linear-gradient(to right, #355342 ${sliderPercent}%, #dfe4d8 ${sliderPercent}%)`,
              }}
              className="mt-5 h-1 w-full cursor-pointer appearance-none rounded-full accent-[#355342] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#355342]"
            />

            <div className="mt-2 flex justify-between text-[11px] text-[#92998e]">
              <span>{formatPrice(0)}</span>
              <span>{formatPrice(maxAvailablePrice)}</span>
            </div>
          </div>
        </aside>

        {/* Products */}
        <section className="min-w-0" aria-label={heading}>
          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className={`${chipBase} ${chipOn} gap-2`}
                  aria-label={`Remove search: ${query.trim()}`}
                >
                  “{query.trim()}”
                  <span aria-hidden="true">×</span>
                </button>
              )}
              {selectedTypes.map((type) => (
                <button
                  key={`type-${type}`}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`${chipBase} ${chipOn} gap-2`}
                  aria-label={`Remove filter: ${type}`}
                >
                  {type}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              {selectedBrands.map((brand) => (
                <button
                  key={`brand-${brand}`}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`${chipBase} ${chipOn} gap-2`}
                  aria-label={`Remove filter: ${brand}`}
                >
                  {brand}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              {hasPriceFilter && (
                <button
                  type="button"
                  onClick={() => setMaxPrice(null)}
                  className={`${chipBase} ${chipOn} gap-2`}
                  aria-label="Remove price filter"
                >
                  Up to {formatPrice(activeMaxPrice)}
                  <span aria-hidden="true">×</span>
                </button>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="ml-1 text-xs font-medium text-[#64806a] underline underline-offset-4 transition-colors hover:text-[#233b30]"
              >
                Clear all
              </button>
            </div>
          )}

          {visibleProducts.length > 0 ? (
            <ProductGrid products={visibleProducts} />
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl bg-[#f3f5ef] px-6 py-14 text-center">
              <span
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-[#7d9a85]"
                aria-hidden="true"
              >
                ✳
              </span>

              <h3 className="mb-2 text-xl font-medium text-[#233b30]">
                No products match these filters
              </h3>

              <p className="mb-7 max-w-sm text-sm leading-6 text-[#6f7a70]">
                Try a different search term, or remove a filter to see more
                supplements.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#355342] px-7 text-[13px] font-semibold text-white transition-colors hover:bg-[#233b30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355342]"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}