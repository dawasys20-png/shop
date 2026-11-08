"use client";

import Link from "next/link";
import { formatPrice } from "../lib/currency";
import { orderStatusLabels } from "../lib/orders";
import { useCart } from "./cart-context";
import { OrderTracking } from "./order-tracking";

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

  return (
    <main className="mx-auto min-h-[60vh] w-[min(100%-2.5rem,80rem)] max-w-[1180px] py-6 pb-20">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link className="hover:text-slate-900 hover:underline hover:underline-offset-3" href="/">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Orders</span>
      </nav>

      <header className="mb-7 mt-6">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#4f8b62]">
          Your order history
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,5vw,3.5rem)] font-normal tracking-[-0.06em] text-slate-900">
          Orders
        </h1>
        <p className="mt-2 text-[15px] text-slate-500">Find the details for your recent orders.</p>
      </header>

      {!ordersReady ? (
        <p className="py-12 text-[15px] text-slate-500" role="status">
          Loading your orders…
        </p>
      ) : ordersError ? (
        <p className="rounded border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
          {ordersError}
        </p>
      ) : orders.length === 0 ? (
        <section className="grid justify-items-start gap-3 rounded-none border border-slate-200 bg-slate-50 p-9">
          <h2 className="font-serif text-3xl font-normal text-slate-900">No orders just yet.</h2>
          <p className="m-0 text-slate-500">When you place an order, its details will appear here.</p>
          <Link className="mt-2 inline-flex min-h-12 items-center justify-center gap-7 bg-slate-900 px-5 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-slate-700" href="/shop">
            Explore essentials <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <section className="grid gap-5" aria-label="Your orders">
          {orders.map((order) => {
            const count = order.items.reduce((total, item) => total + item.quantity, 0);
            return (
              <article className="border border-slate-200 bg-white" key={order.id}>
                <div className="flex items-center justify-between gap-6 border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="grid gap-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4f8b62]">
                      Order placed
                    </p>
                    <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4f8b62]">
                      Order number
                    </p>
                    <strong>{order.id}</strong>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div>
                    <h2 className="mb-1 font-serif text-[21px] font-normal text-slate-900">
                      {count} {count === 1 ? "item" : "items"}
                    </h2>
                    <p className="m-0 text-sm text-slate-500">{order.items.map((item) => item.name).join(", ")}</p>
                  </div>
                  <strong className="whitespace-nowrap text-base font-semibold text-slate-900">
                    {formatPrice(order.total)}
                  </strong>
                </div>

                <OrderTracking status={order.status ?? "received"} />

                <div className="flex flex-col justify-between gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:p-5">
                  <span className="text-sm text-[#355342]">{orderStatusLabels[order.status ?? "received"]}</span>
                  <Link className="inline-flex items-center gap-3 border-b border-slate-400 pb-1 text-sm text-slate-700 transition-all hover:gap-4" href={`/orders/${encodeURIComponent(order.id)}`}>
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
