"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "../lib/currency";
import { orderStatusLabels } from "../lib/orders";
import { useCart } from "./cart-context";
import { BrandLoading } from "./brand-loading";
import { OrderTracking } from "./order-tracking";

/*
  Palette under test
  primary #6D28D9, dark #4C1D95, light #F3E8FF, green #20A800, background #FAFAFA
  Green marks the confirmation check and the "complete" status, with dark text (#0B1F05).
  neutrals: body #4A4658, muted #6B6680, small labels #77728A, divider #E9E1F5
*/

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]";

const pageClass =
  "mx-auto min-h-[60vh] w-[min(100%_-_56px,_1180px)] pb-24 pt-6 max-[600px]:w-[calc(100%_-_32px)] max-[600px]:pb-16 max-[600px]:pt-5";

const statusTone: Record<string, string> = {
  received: "bg-white text-[#4C1D95]",
  processing: "bg-[#FBF3DC] text-[#7A5D12]",
  shipped: "bg-[#E6F1F0] text-[#2F615B]",
  complete: "bg-[#E6F7E1] text-[#14530A]",
  cancelled: "bg-[#FBEFED] text-[#9A443E]",
};

function formatOrderDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-UG", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(date);
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { orders, ordersReady, ordersError } = useCart();
  const order = orders.find((savedOrder) => savedOrder.id === orderId);

  if (!ordersReady) {
    return <BrandLoading />;
  }

  if (!order) {
    return (
      <main className={pageClass}>
        {ordersError && (
          <p
            className="mb-5 rounded-2xl border border-[#F0D3CF] bg-[#FBEFED] px-5 py-4 text-sm text-[#9A443E]"
            role="alert"
          >
            {ordersError}
          </p>
        )}
        <section className="grid justify-items-start gap-3 rounded-3xl bg-[#F3E8FF] p-10 max-[600px]:p-6">
          <h1 className="m-0 text-[28px] font-medium tracking-[-0.02em] text-[#4C1D95]">
            We couldn&apos;t find that order.
          </h1>
          <p className="m-0 mb-2 max-w-md text-[15px] leading-6 text-[#6B6680]">
            It may have been removed, or you may need to sign in to view it.
          </p>
          <Link
            className={`inline-flex min-h-12 items-center justify-center rounded-full bg-[#6D28D9] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#4C1D95] ${focusRing}`}
            href="/orders"
          >
            View all orders
          </Link>
        </section>
      </main>
    );
  }

  const status = order.status ?? "received";

  return (
    <main className={pageClass}>
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#77728A]"
        aria-label="Breadcrumb"
      >
        <Link className="transition-colors hover:text-[#6D28D9]" href="/">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link className="transition-colors hover:text-[#6D28D9]" href="/orders">
          Orders
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#4C1D95]" aria-current="page">
          {order.id}
        </span>
      </nav>

      {/* Confirmation */}
      <header className="mb-10 grid justify-items-center rounded-3xl bg-[#F3E8FF] px-6 py-10 text-center max-[600px]:mb-7 max-[600px]:px-4 max-[600px]:py-8">
        <span
          className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#20A800] text-white"
          aria-hidden="true"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span
          className={`mb-4 inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
            statusTone[status] ?? "bg-white text-[#4C1D95]"
          }`}
        >
          {orderStatusLabels[status]}
        </span>
        <h1 className="m-0 text-[clamp(32px,4.5vw,48px)] font-medium leading-[1.1] tracking-[-0.025em] text-[#4C1D95]">
          Thank you, {order.contact.name.split(" ")[0]}.
        </h1>
        <p className="mb-5 mt-3 text-[15px] text-[#6B6680]">
          Your order details are saved with the store.
        </p>
        <strong className="mb-1 text-sm font-semibold text-[#4C1D95]">
          {order.id}
        </strong>
        <time className="text-xs text-[#6B6680]" dateTime={order.createdAt}>
          {formatOrderDate(order.createdAt)}
        </time>
      </header>

      <OrderTracking status={status} />

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)_minmax(300px,390px)] items-start gap-[clamp(32px,6vw,80px)] max-[760px]:grid-cols-1 max-[760px]:gap-7">
        {/* Items */}
        <section className="min-w-0" aria-label="Items in your order">
          <h2 className="m-0 mb-6 text-[24px] font-medium tracking-[-0.02em] text-[#4C1D95]">
            Items ordered
          </h2>

          <div className="border-t border-[#E9E1F5]">
            {order.items.map((item) => (
              <article
                className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-start gap-4 border-b border-[#E9E1F5] py-5 max-[600px]:grid-cols-[68px_minmax(0,1fr)_auto] max-[600px]:gap-3"
                key={item.id}
              >
                <Image
                  className="h-[96px] w-[84px] rounded-xl bg-[#F3E8FF] object-cover max-[600px]:h-[78px] max-[600px]:w-[68px]"
                  src={item.images?.[0]?.url ?? item.image ?? ""}
                  alt={item.alt ?? ""}
                  width={84}
                  height={96}
                  unoptimized
                />
                <div className="min-w-0">
                  <h3 className="m-0 mb-1 text-[17px] font-medium leading-snug text-[#1F1B2E]">
                    {item.name}
                  </h3>
                  {item.detail && (
                    <p className="mb-1.5 mt-0 text-[13px] leading-5 text-[#77728A]">
                      {item.detail}
                    </p>
                  )}
                  {item.variantForm && (
                    <p className="mb-1.5 mt-0 text-[13px] text-[#6B6680]">
                      {item.variantForm} · {item.variantPotency ?? "Not specified"} ·{" "}
                      {item.variantPackageQuantity ?? "Package not specified"}
                    </p>
                  )}
                  <span className="block text-[13px] text-[#6B6680]">
                    Quantity: {item.quantity}
                  </span>
                </div>
                <strong className="text-[15px] font-semibold text-[#4C1D95]">
                  {formatPrice(item.price * item.quantity)}
                </strong>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-3.5 text-sm text-[#4A4658]">
            <div className="flex justify-between gap-3">
              <span>Subtotal</span>
              <strong className="font-medium text-[#1F1B2E]">
                {formatPrice(order.subtotal)}
              </strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Delivery</span>
              <strong className="font-medium text-[#1F1B2E]">
                {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              </strong>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-[#E9E1F5] pt-4">
              <span className="text-base font-medium text-[#4C1D95]">Total</span>
              <strong className="text-xl font-semibold text-[#4C1D95]">
                {formatPrice(order.total)}
              </strong>
            </div>
          </div>
        </section>

        {/* Contact */}
        <aside className="sticky top-6 rounded-3xl bg-[#F3E8FF] p-7 max-[760px]:static max-[600px]:p-5">
          <h2 className="m-0 mb-5 text-[24px] font-medium tracking-[-0.02em] text-[#4C1D95]">
            Contact and delivery
          </h2>
          <address className="grid gap-2 text-sm not-italic leading-6 text-[#4A4658]">
            <strong className="font-semibold text-[#1F1B2E]">{order.contact.name}</strong>
            <span>{order.contact.email}</span>
            <span>{order.contact.phone}</span>
            <span>{order.contact.address}</span>
            <span>{order.contact.city}</span>
          </address>
          <p className="mb-0 mt-5 border-t border-[#D8C5F5] pt-4 text-xs leading-5 text-[#6B6680]">
            Order record only — no payment has been collected and no shipment has been created.
          </p>
        </aside>
      </div>

      <Link
        className={`mt-10 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E0D6F2] bg-white px-5 text-[13px] font-medium text-[#6D28D9] transition-colors hover:border-[#A78BFA] hover:bg-[#F3E8FF] ${focusRing}`}
        href="/orders"
      >
        View all orders <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}