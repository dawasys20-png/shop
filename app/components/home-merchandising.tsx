"use client";

import Image from "next/image";
import Link from "next/link";
import {
  getCategories,
  getCategorySlug,
  getPrimaryProductImage,
  type Product,
} from "../lib/products";
import { useCatalog } from "./catalog-context";

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function HomeMerchandising({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const { products, ready, loadError } = useCatalog();
  const currentProducts = ready && !loadError ? products : initialProducts;
  const routines = getCategories(currentProducts)
    .filter((category) => category.slug !== "all")
    .flatMap((category) => {
      const product = currentProducts.find(
        ({ category: name }) => getCategorySlug(name) === category.slug,
      );
      return product ? [{ ...category, product }] : [];
    })
    .slice(0, 4);

  return (
    <>
      {loadError && (
        <p className="mx-auto my-6 w-[min(100%_-_32px,_1440px)] rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {loadError} Showing the last catalog snapshot loaded from the backend.
        </p>
      )}
      {routines.length > 0 && (
        <section className="bg-[#eef2ec] px-4 py-16 sm:px-7 lg:px-14">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#4f8b62]">
                Find your fit
              </p>
              <h2 className="text-3xl font-normal tracking-[-0.07em] text-slate-900">
                Shop by category.
              </h2>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Shop supplements by category">
            {routines.map(({ name, slug, product }) => (
              <Link
                className="group relative isolate flex h-40 aspect-square items-end overflow-hidden rounded-full bg-stone-200 text-white"
                href={`/category/${slug}`}
                key={slug}
              >
                <Image
                  src={getPrimaryProductImage(product)}
                  alt=""
                  fill
                  sizes="(max-width: 600px) 50vw, 25vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-slate-900/5" />
                <span className="relative z-10 mr-auto pb-5 pl-5 font-serif text-xl sm:text-[23px]">
                  {name}
                </span>
                <span className="relative z-10 mb-5 mr-5 transition-transform duration-150 group-hover:translate-x-1">
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </nav>
        </section>
      )}

    </>
  );
}
