"use client";

import Link from "next/link";
import { formatPrice } from "../lib/currency";
import { orderStatusLabels } from "../lib/orders";
import { useCart } from "./cart-context";
import { BrandLoading } from "./brand-loading";
import { OrderTracking } from "./order-tracking";

/*
  Palette under test
  primary #6D28D9, dark #4C1D95, light #F3E8FF, green #20A800, background #FAFAFA
  Green is used for the "complete" status and the shopping button, with dark text (#0B1F05).
  neutrals: body #4A4658, muted #6B6680, small labels #77728A, divider #E9E1F5
*/

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]";

const statusTone: Record<string, string> = {
  received: "bg-[#F3E8FF] text-[#4C1D95]",
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
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function OrdersPage() {
  const { orders, ordersReady, ordersError } = useCart();

  if (!ordersReady) {
    return <BrandLoading />;
  }

  return (
    <main className="mx-auto min-h-[60vh] w-[min(100%-2.5rem,80rem)] max-w-[1180px] pb-24 pt-6 max-[600px]:pb-16">
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
          Orders
        </span>
      </nav>

      {/* Page header */}
      <header className="mb-10 border-b border-[#E9E1F5] pb-8 max-[600px]:mb-6 max-[600px]:pb-6">
        <h1 className="m-0 text-[clamp(32px,4vw,44px)] font-medium leading-[1.1] tracking-[-0.025em] text-[#4C1D95]">
          Orders
        </h1>
        <p className="mb-0 mt-2 text-[15px] text-[#6B6680]">
          Find the details for your recent orders.
        </p>
      </header>

      {ordersError ? (
        <p
          className="m-0 rounded-2xl border border-[#F0D3CF] bg-[#FBEFED] p-5 text-sm leading-6 text-[#9A443E]"
          role="alert"
        >
          {ordersError}
        </p>
      ) : orders.length === 0 ? (
        <section className="grid justify-items-start gap-3 rounded-3xl bg-[#F3E8FF] p-10 max-[600px]:p-6">
          <h2 className="m-0 text-[26px] font-medium tracking-[-0.02em] text-[#4C1D95]">
            No orders just yet.
          </h2>
          <p className="m-0 mb-2 text-[15px] text-[#6B6680]">
            When you place an order, its details will appear here.
          </p>
          <Link
            className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#20A800] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#2FC106] ${focusRing}`}
            href="/shop"
          >
            Explore essentials <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <section className="grid gap-6" aria-label="Your orders">
          {orders.map((order) => {
            const count = order.items.reduce((total, item) => total + item.quantity, 0);
            const status = order.status ?? "received";
            return (
              <article
                className="overflow-hidden rounded-3xl border border-[#E9E1F5] bg-white"
                key={order.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 bg-[#F3E8FF] p-5 sm:px-6">
                  <div className="grid gap-1">
                    <p className="m-0 text-xs text-[#6B6680]">Order placed</p>
                    <time
                      className="text-sm font-medium text-[#4C1D95]"
                      dateTime={order.createdAt}
                    >
                      {formatOrderDate(order.createdAt)}
                    </time>
                  </div>
                  <div className="grid gap-1 sm:text-right">
                    <p className="m-0 text-xs text-[#6B6680]">Order number</p>
                    <strong className="text-sm font-semibold text-[#4C1D95]">
                      {order.id}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
                  <div className="min-w-0">
                    <h2 className="m-0 mb-1 text-[19px] font-medium text-[#1F1B2E]">
                      {count} {count === 1 ? "item" : "items"}
                    </h2>
                    <p className="m-0 text-sm leading-6 text-[#6B6680]">
                      {order.items.map((item) => item.name).join(", ")}
                    </p>
                  </div>
                  <strong className="whitespace-nowrap text-lg font-semibold text-[#4C1D95]">
                    {formatPrice(order.total)}
                  </strong>
                </div>

                <OrderTracking status={status} />

                <div className="flex flex-col justify-between gap-3 border-t border-[#E9E1F5] p-5 sm:flex-row sm:items-center sm:px-6">
                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
                      statusTone[status] ?? "bg-[#F3E8FF] text-[#4C1D95]"
                    }`}
                  >
                    {status === "complete" && (
                      <span
                        className="h-2 w-2 rounded-full bg-[#20A800]"
                        aria-hidden="true"
                      />
                    )}
                    {orderStatusLabels[status]}
                  </span>
                  <Link
                    className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E0D6F2] bg-white px-5 text-[13px] font-medium text-[#6D28D9] transition-colors hover:border-[#A78BFA] hover:bg-[#F3E8FF] ${focusRing}`}
                    href={`/orders/${encodeURIComponent(order.id)}`}
                  >
                    View order <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}