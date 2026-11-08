"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatPrice } from "../lib/currency";
import { apiRequest } from "../lib/api";
import {
  getPrimaryProductImage,
  getProductVariants,
  getVariantImages,
  getStartingVariant,
  type Product,
  type ProductVariant,
} from "../lib/products";
import { useCart } from "./cart-context";
import { useCatalog } from "./catalog-context";

const pageWidth =
  "mx-auto w-[min(100%_-_104px,_1440px)] max-[900px]:w-[calc(100%_-_56px)] max-[600px]:w-[calc(100%_-_32px)]";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355342]";

const bodyText = "m-0 text-[14px] leading-7 text-[#4d5a50]";

const infoIcons = {
  use: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  ingredients: (
    <>
      <path d="M5 19c0-8 4-13 14-14 0 10-5 14-13 14" />
      <path d="M5 19c2-4 5-7 9-9" />
    </>
  ),
  facts: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
} as const;

function InfoIcon({ name }: { name: keyof typeof infoIcons }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {infoIcons[name]}
    </svg>
  );
}

type Review = {
  id: string;
  rating: number;
  name: string;
  text: string;
  createdAt: string;
};

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getServingInfo(variant: ProductVariant) {
  const quantity = variant.packageQuantity.match(
    /^\s*(\d+)\s+(servings?|capsules?|softgels?|tablets?|gummies?)\s*$/i,
  );
  if (!quantity) {
    return { portionSize: "See package", totalServings: "See package" };
  }

  const unit = quantity[2].toLowerCase().replace(/s$/, "");
  const portionSize = unit === "softgel" ? "1 softgel" : `1 ${unit}`;
  return { portionSize, totalServings: quantity[1] };
}

function formatBestBefore(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function Stars({
  value,
  label,
  className = "text-lg",
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`flex gap-0.5 leading-none text-[#c78b22] ${className}`}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden="true">
          {index < Math.round(value) ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

const fieldClass =
  "w-full rounded-xl border border-[#dfe4d8] bg-white px-4 text-sm text-[#233b30] outline-none transition-[border-color,box-shadow] placeholder:text-[#9aa297] focus:border-[#64806a] focus:shadow-[0_0_0_3px_rgba(100,128,106,0.15)]";

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ProductDetail({
  product,
  productId,
  initialVariantId,
}: {
  product: Product | null;
  productId: string;
  initialVariantId?: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariantId ?? null,
  );
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const relatedProductsRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { products, ready } = useCatalog();
  const currentProduct = ready
    ? products.find(({ id }) => id === productId)
    : product;

  const reviewVariantId = currentProduct
    ? getProductVariants(currentProduct).find(({ id }) => id === selectedVariantId)?.id ??
      getStartingVariant(currentProduct).id
    : null;
  const [reviewData, setReviewData] = useState<{
    variantId: string;
    reviews: Review[];
    error?: string;
  } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [draftRating, setDraftRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [draftName, setDraftName] = useState("");
  const [draftText, setDraftText] = useState("");
  const [reviewErrors, setReviewErrors] = useState<{
    rating?: string;
    name?: string;
    text?: string;
  }>({});

  useEffect(() => {
    if (!reviewVariantId) return;
    let active = true;
    apiRequest<{ reviews: Review[] }>(
      `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(reviewVariantId)}/reviews`,
    )
      .then(({ reviews }) => {
        if (active) setReviewData({ variantId: reviewVariantId, reviews });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setReviewData({
          variantId: reviewVariantId,
          reviews: [],
          error: error instanceof Error ? error.message : "Reviews could not be loaded.",
        });
      });
    return () => {
      active = false;
    };
  }, [productId, reviewVariantId]);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  if (!ready) {
    return (
      <main
        className={`${pageWidth} min-h-[75vh] pb-24 pt-8`}
        aria-busy="true"
      >
        <p className="py-12 text-[15px] text-[#6f7a70]" role="status">
          Loading product…
        </p>
      </main>
    );
  }

  if (!currentProduct) {
    return (
      <main className={`${pageWidth} min-h-[75vh] pb-24 pt-8`}>
        <section className="grid justify-items-start gap-4 rounded-3xl bg-[#f3f5ef] p-10 max-[600px]:p-6">
          <h1 className="m-0 text-3xl font-medium tracking-[-0.02em] text-[#233b30]">
            This product is no longer available
          </h1>
          <p className="m-0 max-w-md text-[15px] leading-6 text-[#6f7a70]">
            It may have been removed or sold out. Browse the rest of our
            supplements to find something similar.
          </p>
          <Link
            className={`mt-2 inline-flex min-h-12 items-center justify-center rounded-full bg-[#355342] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#233b30] ${focusRing}`}
            href="/shop"
          >
            Browse supplements
          </Link>
        </section>
      </main>
    );
  }

  const productDetails = currentProduct;
  const variants = getProductVariants(productDetails);
  const selectedVariant =
    variants.find(({ id }) => id === selectedVariantId) ??
    getStartingVariant(productDetails);
  const productImages = getVariantImages(productDetails, selectedVariant);
  const selectedImage =
    productImages.find(({ url }) => url === selectedImageUrl) ??
    productImages[0] ??
    { url: "" };
  const { portionSize, totalServings } = getServingInfo(selectedVariant);
  const reviews =
    reviewData?.variantId === selectedVariant.id ? reviewData.reviews : [];
  const reviewLoading = reviewData?.variantId !== selectedVariant.id;
  const reviewLoadError =
    reviewData?.variantId === selectedVariant.id ? reviewData.error : undefined;

  const relatedProducts = products
    .filter(({ id }) => id !== productDetails.id)
    .sort(
      (a, b) =>
        Number(b.category === productDetails.category) -
        Number(a.category === productDetails.category),
    );

  function getBestVariant(field: "form" | "potency" | "packageQuantity", value: string) {
    const matches = variants.filter((variant) => variant[field] === value);
    const bestMatch =
      matches.find(
        (variant) =>
          variant.form === selectedVariant.form &&
          variant.potency === selectedVariant.potency &&
          variant.packageQuantity === selectedVariant.packageQuantity,
      ) ??
      matches.find(
        (variant) =>
          (field === "form" || variant.form === selectedVariant.form) &&
          (field === "potency" || variant.potency === selectedVariant.potency) &&
          (field === "packageQuantity" ||
            variant.packageQuantity === selectedVariant.packageQuantity),
      ) ??
      matches[0];
    return bestMatch;
  }

  function chooseVariantValue(field: "form" | "potency" | "packageQuantity", value: string) {
    const bestMatch = getBestVariant(field, value);
    if (bestMatch) {
      if (bestMatch.id !== selectedVariant.id) {
        setSelectedImageUrl(null);
        setReviewOpen(false);
        setReviewSent(false);
        setReviewSubmitError("");
        setDraftRating(0);
        setDraftText("");
        setReviewErrors({});
      }
      setSelectedVariantId(bestMatch.id);
    }
  }

  function moveRelatedProducts(direction: -1 | 1) {
    relatedProductsRef.current?.scrollBy({
      left: direction * 300,
      behavior: "smooth",
    });
  }

  function handleAddToBag() {
    addToCart(productDetails, quantity, selectedVariant.id);
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1800);
  }

  const optionFields = [
    { field: "form", label: "Product form:" },
    { field: "potency", label: "Potency:" },
    { field: "packageQuantity", label: "Package quantity:" },
  ] as const;

  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : null;
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  function openReviewForm() {
    setReviewSent(false);
    setReviewOpen(true);
  }

  function closeReviewForm() {
    setReviewOpen(false);
    setReviewErrors({});
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: { rating?: string; name?: string; text?: string } = {};
    if (draftRating === 0) errors.rating = "Choose a star rating.";
    if (!draftName.trim()) errors.name = "Enter your name.";
    if (draftText.trim().length < 10)
      errors.text = "Write at least 10 characters.";
    setReviewErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setReviewSubmitting(true);
    setReviewSubmitError("");
    try {
      const { review } = await apiRequest<{ review: Review }>(
        `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(selectedVariant.id)}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            rating: draftRating,
            name: draftName.trim(),
            text: draftText.trim(),
          }),
        },
      );
      setReviewData((current) => ({
        variantId: selectedVariant.id,
        reviews: [
          review,
          ...(current?.variantId === selectedVariant.id ? current.reviews : []),
        ],
      }));
      setDraftRating(0);
      setHoverRating(0);
      setDraftName("");
      setDraftText("");
      setReviewOpen(false);
      setReviewSent(true);
    } catch (error) {
      setReviewSubmitError(
        error instanceof Error ? error.message : "Your review could not be submitted.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <main className={`${pageWidth} min-h-[75vh] pb-28 pt-8 max-[600px]:pt-5`}>
      {/* Breadcrumb */}
      <nav
        className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#858b81]"
        aria-label="Breadcrumb"
      >
        <Link className="transition-colors hover:text-[#355342]" href="/shop">
          Shop all
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          className="transition-colors hover:text-[#355342]"
          href={`/category/${productDetails.category.toLowerCase()}`}
        >
          {productDetails.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#355342]" aria-current="page">
          {productDetails.name}
        </span>
      </nav>

      {/* Product */}
      <section className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-14 max-[1100px]:gap-10 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        {/* Image */}
        <div className={`min-[901px]:sticky min-[901px]:top-28 ${selectedVariant.tone ?? ""}`}>
          <div className="relative aspect-[0.93] overflow-hidden rounded-3xl bg-[#f2f3ee]">
            <Image
              src={selectedImage.url}
              alt={selectedVariant.alt ?? ""}
              fill
              sizes="(max-width: 900px) 100vw, 52vw"
              className="object-cover"
              unoptimized
              priority
            />
            {selectedVariant.tag && (
              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-medium text-[#355342] shadow-[0_1px_2px_rgba(35,59,48,0.08)]">
                {selectedVariant.tag}
              </span>
            )}
          </div>
          {productImages.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-[#6f7a70]">
                Images for {selectedVariant.form} · {selectedVariant.potency} ·{" "}
                {selectedVariant.packageQuantity}
              </p>
              <div className="grid grid-cols-5 gap-2" aria-label="Product images">
              {productImages.map((image, index) => (
                <button
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 ${
                    selectedImage.url === image.url
                      ? "border-[#355342]"
                      : "border-transparent"
                  }`}
                  type="button"
                  key={image.publicId ?? image.url}
                  onClick={() => setSelectedImageUrl(image.url)}
                  aria-label={`View image ${index + 1} for ${selectedVariant.form}, ${selectedVariant.potency}, ${selectedVariant.packageQuantity}`}
                  aria-pressed={selectedImage.url === image.url}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Details and purchase */}
        <div className="min-w-0">
          <h1 className="m-0 text-[clamp(30px,3.6vw,44px)] font-medium leading-[1.1] tracking-[-0.025em] text-[#1f2a24]">
            {productDetails.name}
          </h1>
          <p className="mb-0 mt-3 text-[15px] text-[#6f7a70]">
            By{" "}
            <span className="font-semibold text-[#355342]">
              {productDetails.brand}
            </span>
          </p>

          {reviewCount > 0 && averageRating !== null ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <Stars
                value={averageRating}
                label={`Rated ${averageRating.toFixed(1)} out of 5 from ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`}
              />
              <span className="font-semibold text-[#233b30]">
                {averageRating.toFixed(1)}
              </span>
              <a
                href="#customer-reviews"
                className="text-xs text-[#6f7a70] underline underline-offset-4 hover:text-[#233b30]"
              >
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </a>
            </div>
          ) : (
            <p className="mb-0 mt-4 text-xs text-[#858b81]">
              {reviewLoading ? "Loading option reviews…" : "No reviews for this option yet"}
            </p>
          )}

          <a
            href="#customer-reviews"
            onClick={openReviewForm}
            className={`mt-3 inline-block text-sm font-medium text-[#355342] underline underline-offset-4 hover:text-[#233b30] ${focusRing}`}
          >
            Write a review
          </a>

          {/* Options */}
          <div className="mt-8 grid gap-6 border-t border-[#e3e7dd] pt-8">
            {optionFields.map(({ field, label }) => {
              const options = [
                ...new Set(
                  variants
                    .map((variant) => variant[field]?.trim())
                    .filter(
                      (value): value is string =>
                        Boolean(value) &&
                        !/^(not specified|not provided|n\/a|none)$/i.test(value),
                    ),
                ),
              ];
              if (options.length === 0) return null;

              return (
                <fieldset className="m-0 border-0 p-0" key={field}>
                  <legend className="mb-3 p-0 text-sm font-semibold text-[#233b30]">
                    {label}
                  </legend>
                  {field === "packageQuantity" ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
                      {options.map((option) => {
                        const on = selectedVariant[field] === option;
                        const optionVariant = getBestVariant(field, option);
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={on}
                            onClick={() => chooseVariantValue(field, option)}
                            className={`rounded-2xl border p-4 text-left transition-colors ${focusRing} ${
                              on
                                ? "border-[#355342] bg-[#f3f5ef] shadow-[inset_0_0_0_1px_#355342]"
                                : "border-[#dfe4d8] bg-white hover:border-[#9db0a0]"
                            }`}
                          >
                            <span className="block text-[15px] font-semibold text-[#233b30]">
                              {option}
                            </span>
                            {optionVariant && (
                              <span
                                className={`mt-1.5 block text-[13px] ${
                                  on ? "font-semibold text-[#355342]" : "text-[#6f7a70]"
                                }`}
                              >
                                {formatPrice(optionVariant.price)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => {
                        const on = selectedVariant[field] === option;
                        const optionVariant = getBestVariant(field, option);
                        if (field === "form" && optionVariant) {
                          const optionImage =
                            getVariantImages(productDetails, optionVariant)[0]?.url ?? "";
                          return (
                            <button
                              key={option}
                              type="button"
                              aria-pressed={on}
                              onClick={() => chooseVariantValue(field, option)}
                              className={`inline-flex min-w-24 flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-colors ${focusRing} ${
                                on
                                  ? "border-[#355342] bg-[#f3f5ef] shadow-[inset_0_0_0_1px_#355342]"
                                  : "border-[#dfe4d8] bg-white hover:border-[#9db0a0]"
                              }`}
                            >
                              <Image
                                src={optionImage}
                                alt=""
                                width={72}
                                height={72}
                                className="h-[72px] w-[72px] rounded-xl object-cover"
                                unoptimized
                              />
                              <span className="text-[13px] font-semibold text-[#233b30]">
                                {option}
                              </span>
                            </button>
                          );
                        }
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={on}
                            onClick={() => chooseVariantValue(field, option)}
                            className={`inline-flex min-h-16 min-w-24 flex-col items-center justify-center rounded-2xl border px-4 py-3 text-center text-[13px] font-semibold transition-colors ${focusRing} ${
                              on
                                ? "border-[#355342] bg-[#f3f5ef] text-[#233b30] shadow-[inset_0_0_0_1px_#355342]"
                                : "border-[#dfe4d8] bg-white text-[#5f6b61] hover:border-[#9db0a0]"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              );
            })}
            <section
              className="rounded-2xl bg-[#f3f5ef] p-5"
              aria-labelledby="key-information-heading"
            >
              <h2
                id="key-information-heading"
                className="mb-4 mt-0 text-sm font-semibold text-[#233b30]"
              >
                Key information
              </h2>
              <dl className="m-0 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-[#6f7a70]">Portion size</dt>
                  <dd className="m-0 mt-1 text-sm font-medium text-[#233b30]">
                    {portionSize}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#6f7a70]">Total servings</dt>
                  <dd className="m-0 mt-1 text-sm font-medium text-[#233b30]">
                    {totalServings}
                  </dd>
                </div>
              </dl>
              <dl className="mt-4 border-t border-[#dfe4d8] pt-3">
                <dt className="text-xs text-[#6f7a70]">Best before / expiry</dt>
                <dd className="m-0 mt-1 text-sm font-medium text-[#233b30]">
                  {selectedVariant.bestBefore
                    ? formatBestBefore(selectedVariant.bestBefore)
                    : "Not provided"}
                </dd>
              </dl>
            </section>
          </div>

          {/* Purchase */}
          <div className="mt-8 rounded-3xl bg-[#f3f5ef] p-6 max-[600px]:p-5">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <p className="m-0 text-[32px] font-semibold leading-none tracking-tight text-[#233b30]">
                {formatPrice(selectedVariant.price)}
              </p>
              <p className="m-0 text-[13px] text-[#6f7a70]">
                {selectedVariant.form}, {selectedVariant.potency},{" "}
                {selectedVariant.packageQuantity}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
              <div
                className="flex h-[52px] items-center rounded-full border border-[#dfe4d8] bg-white p-1"
                role="group"
                aria-label="Quantity"
              >
                <button
                  className={`grid h-11 w-11 place-items-center rounded-full text-xl text-[#355342] transition-colors hover:bg-[#f3f5ef] ${focusRing}`}
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span
                  className="min-w-8 text-center text-sm font-medium text-[#233b30]"
                  aria-live="polite"
                >
                  {quantity}
                </span>
                <button
                  className={`grid h-11 w-11 place-items-center rounded-full text-xl text-[#355342] transition-colors hover:bg-[#f3f5ef] ${focusRing}`}
                  type="button"
                  onClick={() => setQuantity((current) => current + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                className={`min-h-[52px] rounded-full px-5 text-sm font-semibold text-white transition-colors ${focusRing} ${
                  added ? "bg-[#233b30]" : "bg-[#355342] hover:bg-[#233b30]"
                }`}
                type="button"
                onClick={handleAddToBag}
              >
                {added
                  ? "Added to bag"
                  : `Add to bag · ${formatPrice(selectedVariant.price * quantity)}`}
              </button>
            </div>

            <span className="sr-only" role="status">
              {added ? `${productDetails.name} added to bag` : ""}
            </span>

            <p className="mb-0 mt-4 text-xs leading-5 text-[#6f7a70]">
              Free shipping on orders {formatPrice(60)}+. Easy, secure checkout.
            </p>
          </div>
        </div>
      </section>

      {/* Product information */}
      <section
        className="mt-20 max-[600px]:mt-14"
        aria-labelledby="product-information-heading"
      >
        <h2
          id="product-information-heading"
          className="mb-8 mt-0 text-[28px] font-medium tracking-[-0.02em] text-[#233b30]"
        >
          Product information
        </h2>

        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-12 border-t border-[#e3e7dd] pt-10 max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[600px]:pt-8">
          <div>
            <h3 className="mb-4 mt-0 text-lg font-medium text-[#233b30]">
              Overview
            </h3>
            <p className="m-0 max-w-[62ch] text-[15px] leading-8 text-[#4d5a50]">
              {selectedVariant.description}
            </p>
          </div>

          <div className="rounded-3xl bg-[#f3f5ef] p-6 max-[600px]:p-5">
            <h3 className="mb-4 mt-0 text-lg font-medium text-[#233b30]">
              Specifications
            </h3>
            <dl className="m-0 grid text-sm">
              {[
                ["Brand", productDetails.brand],
                ["Category", productDetails.category],
                ["Product type", selectedVariant.type ?? ""],
                ["Selected package", selectedVariant.packageQuantity],
              ].map(([label, value], index, rows) => (
                <div
                  className={`flex justify-between gap-4 py-3 ${
                    index < rows.length - 1 ? "border-b border-[#dfe4d8]" : ""
                  }`}
                  key={label}
                >
                  <dt className="text-[#6f7a70]">{label}</dt>
                  <dd className="m-0 text-right font-medium text-[#233b30]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 max-[900px]:grid-cols-1 max-[900px]:gap-4">
          {[
            {
              title: "Suggested use",
              icon: "use",
              text:
                selectedVariant.howToUse ||
                "Follow the directions on the product label.",
            },
            {
              title: "Other ingredients",
              icon: "ingredients",
              text:
                selectedVariant.ingredients ||
                "Refer to product packaging for ingredient details.",
            },
            {
              title: "Supplement information",
              icon: "facts",
              text:
                selectedVariant.supplementInformation ||
                "Supplement facts have not been added to this demo catalog. Refer to product packaging for complete, verified information.",
            },
          ].map(({ title, icon, text }) => (
            <article
              className="rounded-2xl border border-[#e3e7dd] bg-white p-6"
              key={title}
            >
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-[#edf1eb] text-[#355342]">
                <InfoIcon name={icon as keyof typeof infoIcons} />
              </span>
              <h3 className="mb-2 mt-0 text-[16px] font-medium text-[#233b30]">
                {title}
              </h3>
              <p className={bodyText}>{text}</p>
            </article>
          ))}
        </div>

        <aside
          className="mt-6 flex gap-4 rounded-2xl border border-[#ecdcae] bg-[#fbf7ea] p-6 max-[600px]:flex-col max-[600px]:gap-3"
          aria-labelledby="product-warnings-heading"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4e9c4] text-[#8a6a14]">
            <InfoIcon name="warning" />
          </span>
          <div>
            <h3
              id="product-warnings-heading"
              className="mb-2 mt-0 text-[16px] font-medium text-[#4a3e12]"
            >
              Warnings
            </h3>
            <p className="m-0 text-[14px] leading-7 text-[#5c5130]">
              {selectedVariant.warnings ||
                "No product-specific warnings have been provided. Read the label and consult a qualified healthcare professional if you have questions."}
            </p>
          </div>
        </aside>
      </section>

      {/* Reviews */}
      <section
        id="customer-reviews"
        className="mt-20 scroll-mt-28 max-[600px]:mt-14"
        aria-labelledby="customer-reviews-heading"
      >
        <h2
          id="customer-reviews-heading"
          className="mb-8 mt-0 text-[28px] font-medium tracking-[-0.02em] text-[#233b30]"
        >
          Reviews for {selectedVariant.form} · {selectedVariant.potency} ·{" "}
          {selectedVariant.packageQuantity}
        </h2>

        <div className="grid grid-cols-[minmax(0,340px)_minmax(0,1fr)] items-start gap-12 border-t border-[#e3e7dd] pt-10 max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[600px]:pt-8">
          {/* Summary */}
          <div className="rounded-3xl bg-[#f3f5ef] p-6 max-[600px]:p-5">
            {reviewLoadError ? (
              <p className="m-0 text-sm leading-6 text-[#9a443e]" role="alert">
                {reviewLoadError}
              </p>
            ) : reviewLoading ? (
              <p className="m-0 text-sm text-[#6f7a70]" role="status">
                Loading reviews for this option…
              </p>
            ) : averageRating !== null ? (
              <>
                <div className="flex items-end gap-3">
                  <p className="m-0 text-[48px] font-semibold leading-none tracking-tight text-[#233b30]">
                    {averageRating.toFixed(1)}
                  </p>
                  <p className="mb-1 mt-0 text-sm text-[#6f7a70]">out of 5</p>
                </div>
                <Stars
                  className="mt-3 text-xl"
                  value={averageRating}
                  label={`Rated ${averageRating.toFixed(1)} out of 5`}
                />
                <p className="mb-0 mt-2 text-sm text-[#6f7a70]">
                  Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </p>

                <ul className="m-0 mt-6 grid list-none gap-2.5 p-0">
                  {ratingCounts.map(({ stars, count }) => (
                    <li
                      className="grid grid-cols-[28px_1fr_24px] items-center gap-3 text-[13px] text-[#6f7a70]"
                      key={stars}
                    >
                      <span>{stars} ★</span>
                      <span className="h-2 overflow-hidden rounded-full bg-[#dfe4d8]">
                        <span
                          className="block h-full rounded-full bg-[#355342]"
                          style={{ width: `${(count / reviewCount) * 100}%` }}
                        />
                      </span>
                      <span className="text-right">{count}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="m-0 text-lg font-medium text-[#233b30]">
                  No reviews yet
                </p>
                <p className="mb-0 mt-2 text-sm leading-6 text-[#6f7a70]">
                  Used this product? Share what you think to help others choose.
                </p>
              </>
            )}

            <button
              type="button"
              onClick={reviewOpen ? closeReviewForm : openReviewForm}
              disabled={reviewLoading || Boolean(reviewLoadError)}
              aria-expanded={reviewOpen}
              aria-controls="review-form"
              className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors ${focusRing} ${
                reviewOpen
                  ? "border border-[#355342] bg-transparent text-[#355342] hover:bg-white"
                  : "bg-[#355342] text-white hover:bg-[#233b30]"
              }`}
            >
              {reviewOpen ? "Cancel" : "Write a review"}
            </button>
          </div>

          {/* Form and list */}
          <div className="min-w-0">
            {reviewSent && (
              <p
                className="mb-6 mt-0 rounded-2xl bg-[#edf1eb] px-5 py-4 text-sm text-[#355342]"
                role="status"
              >
                Thanks, your review has been added.
              </p>
            )}

            {reviewOpen && (
              <form
                id="review-form"
                onSubmit={submitReview}
                noValidate
                className="mb-10 grid gap-6 rounded-3xl border border-[#e3e7dd] bg-white p-6 max-[600px]:p-5"
              >
                <h3 className="m-0 text-lg font-medium text-[#233b30]">
                  Review {selectedVariant.form} · {selectedVariant.potency} ·{" "}
                  {selectedVariant.packageQuantity}
                </h3>

                <fieldset className="m-0 border-0 p-0">
                  <legend className="mb-3 p-0 text-sm font-semibold text-[#233b30]">
                    Your rating
                  </legend>
                  <div
                    className="flex gap-1"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((value) => {
                      const filled = value <= (hoverRating || draftRating);
                      return (
                        <label
                          key={value}
                          className="cursor-pointer rounded-md p-0.5 text-[34px] leading-none focus-within:outline focus-within:outline-2 focus-within:outline-[#355342]"
                          onMouseEnter={() => setHoverRating(value)}
                        >
                          <input
                            type="radio"
                            name="review-rating"
                            value={value}
                            checked={draftRating === value}
                            onChange={() => setDraftRating(value)}
                            className="sr-only"
                            aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                          />
                          <span
                            className={filled ? "text-[#c78b22]" : "text-[#d5d9cf]"}
                            aria-hidden="true"
                          >
                            ★
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {reviewErrors.rating && (
                    <p className="mb-0 mt-2 text-xs text-[#a3412c]" role="alert">
                      {reviewErrors.rating}
                    </p>
                  )}
                </fieldset>

                <div>
                  <label
                    htmlFor="review-name"
                    className="mb-2 block text-sm font-semibold text-[#233b30]"
                  >
                    Your name
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    autoComplete="name"
                    maxLength={60}
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    aria-invalid={Boolean(reviewErrors.name)}
                    aria-describedby={reviewErrors.name ? "review-name-error" : undefined}
                    className={`${fieldClass} h-12`}
                  />
                  {reviewErrors.name && (
                    <p
                      id="review-name-error"
                      className="mb-0 mt-2 text-xs text-[#a3412c]"
                      role="alert"
                    >
                      {reviewErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="review-text"
                    className="mb-2 block text-sm font-semibold text-[#233b30]"
                  >
                    Your review
                  </label>
                  <textarea
                    id="review-text"
                    rows={5}
                    maxLength={1000}
                    value={draftText}
                    onChange={(event) => setDraftText(event.target.value)}
                    placeholder="What did you like or dislike? How did you use it?"
                    aria-invalid={Boolean(reviewErrors.text)}
                    aria-describedby={reviewErrors.text ? "review-text-error" : undefined}
                    className={`${fieldClass} resize-y py-3 leading-6`}
                  />
                  <div className="mt-2 flex justify-between gap-4">
                    {reviewErrors.text ? (
                      <p
                        id="review-text-error"
                        className="m-0 text-xs text-[#a3412c]"
                        role="alert"
                      >
                        {reviewErrors.text}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-[#858b81]">
                      {draftText.length}/1000
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className={`inline-flex min-h-12 items-center justify-center rounded-full bg-[#355342] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#233b30] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit review"}
                  </button>
                  <button
                    type="button"
                    onClick={closeReviewForm}
                    className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-medium text-[#6f7a70] transition-colors hover:text-[#233b30] ${focusRing}`}
                  >
                    Cancel
                  </button>
                </div>
                {reviewSubmitError && (
                  <p className="m-0 text-sm text-[#9a443e]" role="alert">
                    {reviewSubmitError}
                  </p>
                )}
              </form>
            )}

            {reviewLoadError && (
              <p className="mb-5 text-sm text-[#9a443e]" role="alert">
                Reviews are unavailable right now: {reviewLoadError}
              </p>
            )}
            {reviewLoading && (
              <p className="m-0 text-sm text-[#6f7a70]" role="status">
                Loading reviews for this option…
              </p>
            )}
            {reviewCount > 0 ? (
              <ul className="m-0 list-none p-0">
                {reviews.map((review) => (
                  <li
                    className="border-b border-[#e3e7dd] py-6 first:pt-0 last:border-b-0"
                    key={review.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Stars
                        className="text-base"
                        value={review.rating}
                        label={`Rated ${review.rating} out of 5`}
                      />
                      <time
                        dateTime={review.createdAt}
                        className="text-xs text-[#858b81]"
                      >
                        {formatReviewDate(review.createdAt)}
                      </time>
                    </div>
                    <p className="mb-0 mt-3 text-sm font-semibold text-[#233b30]">
                      {review.name}
                    </p>
                    <p className="mb-0 mt-2 max-w-[68ch] whitespace-pre-line text-[14px] leading-7 text-[#4d5a50]">
                      {review.text}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              !reviewLoading &&
              !reviewLoadError &&
              !reviewOpen &&
              !reviewSent && (
                <p className="m-0 text-[15px] leading-7 text-[#6f7a70]">
                  Be the first to review this {selectedVariant.form} option.
                </p>
              )
            )}
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section
          className="mt-20 max-[600px]:mt-14"
          aria-labelledby="related-products-heading"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2
              id="related-products-heading"
              className="m-0 text-[28px] font-medium tracking-[-0.02em] text-[#233b30]"
            >
              Related products
            </h2>
            <div className="flex gap-2 max-[600px]:hidden">
              <button
                className={`grid h-11 w-11 place-items-center rounded-full border border-[#dfe4d8] bg-white text-[#355342] transition-colors hover:border-[#9db0a0] hover:bg-[#f3f5ef] ${focusRing}`}
                type="button"
                aria-label="Scroll related products left"
                onClick={() => moveRelatedProducts(-1)}
              >
                <Chevron className="rotate-90" />
              </button>
              <button
                className={`grid h-11 w-11 place-items-center rounded-full border border-[#dfe4d8] bg-white text-[#355342] transition-colors hover:border-[#9db0a0] hover:bg-[#f3f5ef] ${focusRing}`}
                type="button"
                aria-label="Scroll related products right"
                onClick={() => moveRelatedProducts(1)}
              >
                <Chevron className="-rotate-90" />
              </button>
            </div>
          </div>

          <div
            className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-3 scrollbar-none max-[600px]:gap-4"
            ref={relatedProductsRef}
            aria-label="Related products carousel"
          >
            {relatedProducts.map((relatedProduct) => {
              const relatedVariant = getStartingVariant(relatedProduct);
              return (
              <Link
                className={`group w-[min(68vw,_270px)] shrink-0 snap-start ${focusRing}`}
                href={`/products/${relatedProduct.id}`}
                key={relatedProduct.id}
              >
                <div
                  className={`relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-[#f2f3ee] ${relatedVariant.tone ?? ""}`}
                >
                  <Image
                    src={getPrimaryProductImage(relatedProduct)}
                    alt={relatedVariant.alt ?? ""}
                    fill
                    sizes="270px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    unoptimized
                  />
                </div>
                <h3 className="mb-1 mt-0 text-[15px] font-medium leading-snug text-[#1f2a24] transition-colors group-hover:text-[#355342]">
                  {relatedProduct.name}
                </h3>
                <p className="mb-2.5 mt-0 line-clamp-2 text-[13px] leading-5 text-[#7a8379]">
                  {relatedVariant.detail}
                </p>
                <p className="m-0 text-[15px] font-semibold tracking-tight text-[#233b30]">
                  {formatPrice(relatedVariant.price)}
                </p>
              </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}