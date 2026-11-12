"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";
import {
  getProductVariants,
  getProductVariantSlug,
  getVariantImages,
  type Product,
} from "../lib/products";
import { formatPrice } from "../lib/currency";
import { useCatalog } from "./catalog-context";

const addButtonBase =
  "absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center gap-2 rounded-full text-xs font-semibold text-white shadow-[0_2px_8px_rgba(35,59,48,0.25)] transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:inset-x-4 md:bottom-4 md:h-11 md:w-auto";

// Round icon on phones; full-width pill that appears on hover for larger screens
const addButtonIdle =
  "bg-[#355342] hover:bg-[#233b30] md:translate-y-2 md:bg-white md:text-[#233b30] md:opacity-0 md:shadow-sm md:hover:bg-[#233b30] md:hover:text-white md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100 [@media(hover:none)]:md:translate-y-0 [@media(hover:none)]:md:bg-[#355342] [@media(hover:none)]:md:text-white [@media(hover:none)]:md:opacity-100";

// Stays visible briefly after an item is added
const addButtonAdded = "bg-[#233b30] md:translate-y-0 md:opacity-100";

export function ProductGrid({ products }: { products: Product[] }) {
  const { addToCart } = useCart();
  const {
    products: catalogProducts,
    ready: catalogReady,
    loadError,
  } = useCatalog();
  const [addedId, setAddedId] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const currentProducts = catalogReady && !loadError
    ? products.flatMap((product) => {
        const currentProduct = catalogProducts.find(
          ({ id }) => id === product.id,
        );
        if (!currentProduct) return [];
        const visibleVariantIds = new Set(
          getProductVariants(product).map(({ id }) => id),
        );
        return [{
          ...currentProduct,
          variants: getProductVariants(currentProduct).filter(({ id }) =>
            visibleVariantIds.has(id),
          ),
        }];
      })
    : products;
  const productOptions = currentProducts.flatMap((product) =>
      getProductVariants(product).map((variant) => ({ product, variant })),
  );

  if (productOptions.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl bg-[#f3f5ef] px-6 py-12 text-center">
        <span
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-[#7d9a85]"
          aria-hidden="true"
        >
          ✳
        </span>
        <h3 className="mb-2 text-lg font-medium text-[#233b30]">
          No supplements found
        </h3>
        <p className="mb-0 max-w-xs text-sm leading-6 text-[#6f7a70]">
          Try a different search or remove a filter to see more.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
      {productOptions.map(({ product, variant }) => {
        const optionKey = `${product.id}:${variant.id}`;
        const added = addedId === optionKey;
        const rating = variant.rating;
        const detailHref = `/products/${product.id}?variant=${encodeURIComponent(getProductVariantSlug(variant, getProductVariants(product)))}`;
        const image = getVariantImages(product, variant)[0]?.url ?? "";

        return (
          <article className="group min-w-0" key={optionKey}>
            {/* Product image */}
            <div
              className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f2f3ee] ${variant.tone ?? ""}`}
            >
              <Link
                href={detailHref}
                aria-label={`View ${product.name}, ${variant.form}, ${variant.potency}, ${variant.packageQuantity}`}
                className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#355342]"
              >
                <Image
                  src={image}
                  alt={variant.alt ?? ""}
                  fill
                  sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  unoptimized
                />
              </Link>

              {/* Product label */}
              {variant.tag && (
                <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-[11px] font-medium text-[#355342] shadow-[0_1px_2px_rgba(35,59,48,0.08)] sm:left-4 sm:top-4 sm:text-xs">
                  {variant.tag}
                </span>
              )}

              {/* Add to bag */}
              <button
                type="button"
                className={`${addButtonBase} ${added ? addButtonAdded : addButtonIdle}`}
                onClick={() => {
                  addToCart(product, 1, variant.id);
                  setAddedId(optionKey);
                  clearTimeout(resetTimer.current);
                  resetTimer.current = setTimeout(
                    () => setAddedId(null),
                    1600,
                  );
                }}
                aria-label={`Add ${product.name}, ${variant.form}, ${variant.potency}, ${variant.packageQuantity} to bag`}
              >
                <span className="max-md:hidden">
                  {added ? "Added" : "Add to bag"}
                </span>
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {added ? (
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  ) : (
                    <>
                      <path d="M5 8h14l1 12H4L5 8Z" />
                      <path d="M9 8a3 3 0 0 1 6 0" />
                    </>
                  )}
                </svg>
              </button>

              <span className="sr-only" role="status">
                {added ? `${product.name}, ${variant.form}, ${variant.potency}, ${variant.packageQuantity} added to bag` : ""}
              </span>
            </div>

            {/* Product information */}
            <div className="pt-4">
              <Link
                href={detailHref}
                className="group/name block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#355342]"
              >
                <h3 className="mb-1 text-[15px] font-medium leading-snug text-[#1f2a24] transition-colors group-hover/name:text-[#355342] sm:text-[16px]">
                  {product.name}
                </h3>

                {typeof rating === "number" && rating > 0 && (
                  <span
                    className="mb-1.5 flex items-center gap-1.5 text-xs text-[#8a6a14]"
                    role="img"
                    aria-label={`Rated ${rating.toFixed(1)} out of 5`}
                  >
                    <span aria-hidden="true" className="text-[#fbbf24] text-[18px]">
                      {Array.from({ length: 5 }, (_, index) =>
                        index < Math.round(rating) ? "★" : "☆",
                      ).join("")}
                    </span>
                    <span className="text-[#6f7a70] text-[12px]" aria-hidden="true">
                      {rating.toFixed(1)}
                    </span>
                  </span>
                )}

                {/* <p className="mb-0 line-clamp-2 text-[12px] leading-5 text-[#7a8379] sm:text-[13px]">
                  {variant.form} · {variant.potency} · {variant.packageQuantity}
                </p> */}
              </Link>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="mb-0 text-[15px] font-semibold tracking-tight text-[#233b30] sm:text-[16px]">
                  {formatPrice(variant.price)}
                </p>
                <span className="rounded-full bg-[#f3f5ef] px-2.5 py-1 text-[11px] text-[#6f7a70]">
                  {variant.form}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}