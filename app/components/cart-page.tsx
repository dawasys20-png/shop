"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "../lib/currency";
import { getVariantImages } from "../lib/products";
import { useCart } from "./cart-context";

/*
  Palette under test
  primary #6D28D9, dark #4C1D95, light #F3E8FF, green #20A800, background #FAFAFA
  Green is for the checkout action and free-shipping progress. Dark text (#0B1F05)
  on green, because white on this green is too low contrast for small text.
  neutrals: body #4A4658, muted #6B6680, small labels #77728A, divider #E9E1F5, control border #E0D6F2
*/

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]";

const greenButton = `inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#20A800] px-7 text-sm font-semibold text-[#0B1F05] transition-colors hover:bg-[#2FC106] ${focusRing}`;

export function CartPage() {
  const { cart, cartReady, subtotal, shipping, changeQuantity } =
    useCart();

  const itemCount = cart.reduce((total, { quantity }) => total + quantity, 0);

  return (
    <main className="mx-auto min-h-[60vh] w-[min(100%_-_56px,_1240px)] pb-24 pt-6 max-[600px]:w-[calc(100%_-_32px)] max-[600px]:pb-16 max-[600px]:pt-5">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#77728A]"
        aria-label="Breadcrumb"
      >
        <Link className="transition-colors hover:text-[#6D28D9]" href="/">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#4C1D95]" aria-current="page">
          Your bag
        </span>
      </nav>

      {/* Page header */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-[#E9E1F5] pb-8 max-[600px]:mb-6 max-[600px]:pb-6">
        <div>
          <h1 className="m-0 text-[clamp(32px,4vw,44px)] font-medium leading-[1.1] tracking-[-0.025em] text-[#4C1D95]">
            Your bag
          </h1>
          <p className="mb-0 mt-2 text-[15px] text-[#6B6680]">
            A little goodness, gathered.
          </p>
        </div>
        {cartReady && cart.length > 0 && (
          <p className="m-0 text-sm text-[#6B6680]" aria-live="polite">
            <span className="text-2xl font-medium tracking-tight text-[#4C1D95]">
              {itemCount}
            </span>{" "}
            {itemCount === 1 ? "item" : "items"}
          </p>
        )}
      </header>

      {!cartReady ? (
        <p className="py-12 text-[15px] text-[#6B6680]" role="status">
          Loading your bag…
        </p>
      ) : cart.length === 0 ? (
        <section className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-[#F3E8FF] px-6 py-14 text-center">
          <span
            className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-white text-[#6D28D9]"
            aria-hidden="true"
          >
            <svg
              width="27"
              height="27"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 8h14l1 12H4L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
          </span>
          <h2 className="m-0 mb-2 text-[26px] font-medium tracking-[-0.02em] text-[#4C1D95]">
            Your bag is taking a breather.
          </h2>
          <p className="mb-7 mt-0 max-w-sm text-[15px] leading-6 text-[#6B6680]">
            Find something good for your everyday.
          </p>
          <Link className={greenButton} href="/shop">
            Explore essentials <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(300px,380px)] items-start gap-[clamp(32px,6vw,80px)] max-[800px]:grid-cols-[minmax(0,1fr)_minmax(270px,320px)] max-[800px]:gap-6 max-[650px]:grid-cols-1">
          {/* Items */}
          <section
            className="min-w-0 border-t border-[#E9E1F5]"
            aria-label="Items in your bag"
          >
            {cart.map(({ key, product, variant, quantity }) => (
              <article
                className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-start gap-6 border-b border-[#E9E1F5] py-7 max-[800px]:grid-cols-[88px_minmax(0,1fr)_auto] max-[800px]:gap-4 max-[650px]:grid-cols-[80px_minmax(0,1fr)] max-[650px]:py-5"
                key={key}
              >
                <Link
                  href={`/products/${product.id}`}
                  aria-label={`View ${product.name}`}
                  className={`group block overflow-hidden rounded-2xl bg-[#F3E8FF] ${focusRing}`}
                >
                  <Image
                    className="aspect-[0.88] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
                    src={getVariantImages(product, variant)[0]?.url ?? ""}
                    alt={variant.alt ?? ""}
                    width={110}
                    height={124}
                    unoptimized
                  />
                </Link>

                <div className="min-w-0">
                  <h2 className="m-0 text-[17px] font-medium leading-snug text-[#1F1B2E] sm:text-[19px]">
                    <Link
                      className={`transition-colors hover:text-[#6D28D9] ${focusRing}`}
                      href={`/products/${product.id}`}
                    >
                      {product.name}
                    </Link>
                  </h2>
                  {variant.detail && (
                    <p className="mb-0 mt-1 text-[13px] leading-5 text-[#77728A]">
                      {variant.detail}
                    </p>
                  )}
                  <p className="mb-0 mt-1.5 text-[13px] text-[#6B6680]">
                    {variant.form} · {variant.potency} · {variant.packageQuantity}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div
                      className="inline-flex h-10 items-center rounded-full border border-[#E0D6F2] bg-white p-0.5"
                      role="group"
                      aria-label={`${product.name} quantity`}
                    >
                      <button
                        type="button"
                        onClick={() => changeQuantity(key, -1)}
                        aria-label={`Decrease ${product.name} quantity`}
                        className={`grid h-9 w-9 place-items-center rounded-full text-lg text-[#6D28D9] transition-colors hover:bg-[#F3E8FF] ${focusRing}`}
                      >
                        −
                      </button>
                      <span className="min-w-7 text-center text-sm font-medium text-[#4C1D95]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(key, 1)}
                        aria-label={`Increase ${product.name} quantity`}
                        className={`grid h-9 w-9 place-items-center rounded-full text-lg text-[#6D28D9] transition-colors hover:bg-[#F3E8FF] ${focusRing}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeQuantity(key, -quantity)}
                      className={`border-0 bg-transparent p-0 text-[13px] text-[#6B6680] underline underline-offset-4 transition-colors hover:text-[#4C1D95] ${focusRing}`}
                      aria-label={`Remove ${product.name} from your bag`}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid justify-items-end gap-1 pt-0.5 max-[650px]:col-start-2 max-[650px]:justify-items-start">
                  <strong className="text-base font-semibold text-[#4C1D95]">
                    {formatPrice(variant.price * quantity)}
                  </strong>
                  {quantity > 1 && (
                    <span className="text-xs text-[#77728A]">
                      {formatPrice(variant.price)} each
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>

          {/* Summary */}
          <aside
            className="sticky top-6 rounded-3xl bg-[#F3E8FF] p-7 max-[650px]:static max-[650px]:p-5"
            aria-label="Order summary"
          >
            <h2 className="m-0 mb-5 text-[24px] font-medium tracking-[-0.02em] text-[#4C1D95]">
              Order summary
            </h2>

            <div className="rounded-2xl bg-white p-4">
              <p className="m-0 flex items-center gap-2.5 text-[13px] leading-5 text-[#4A4658]">
                {shipping === 0 && (
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#20A800] text-[#0B1F05]"
                    aria-hidden="true"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                )}
                <span>
                  {shipping === 0 ? (
                    <>You unlocked free shipping!</>
                  ) : (
                    <>You&apos;re {formatPrice(60 - subtotal)} away from free shipping.</>
                  )}
                </span>
              </p>
              <span
                className="mt-3 block h-2 w-full overflow-hidden rounded-full bg-[#E0D6F2]"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-[#20A800] transition-[width] duration-200 motion-reduce:transition-none"
                  style={{ width: `${Math.min((subtotal / 60) * 100, 100)}%` }}
                />
              </span>
            </div>

            <div className="mt-6 grid gap-3.5 text-sm text-[#4A4658]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong className="font-medium text-[#1F1B2E]">
                  {formatPrice(subtotal)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <strong className="font-medium text-[#1F1B2E]">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </strong>
              </div>
              <div className="mt-1 flex items-baseline justify-between border-t border-[#D8C5F5] pt-4">
                <span className="text-base font-medium text-[#4C1D95]">Total</span>
                <strong className="text-xl font-semibold text-[#4C1D95]">
                  {formatPrice(subtotal + shipping)}
                </strong>
              </div>
            </div>

            <Link
              className={`${greenButton} mt-6 w-full justify-between`}
              href="/checkout"
            >
              Continue to checkout <span aria-hidden="true">→</span>
            </Link>
            <p className="mb-0 mt-3 text-center text-xs text-[#6B6680]">
              Demo checkout · Free shipping over UGX 60
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}