"use client";

import Image from "next/image";
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
        dateStyle: "long",
        timeStyle: "short",
      }).format(date);
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { orders, ordersReady, ordersError } = useCart();
  const order = orders.find((savedOrder) => savedOrder.id === orderId);

  if (!ordersReady) {
    return (
      <main className={`orders-page w-[min(100%_-_56px,_1180px)] min-h-[60vh] m-[0_auto] p-[22px_0_84px] max-[600px]:w-[calc(100%_-_36px)] max-[600px]:p-[18px_0_64px]`}>
        <p className={`cart-page-loading p-[48px_0] text-gray-500 text-[15px]`} role="status">Loading your order…</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className={`orders-page w-[min(100%_-_56px,_1180px)] min-h-[60vh] m-[0_auto] p-[22px_0_84px] max-[600px]:w-[calc(100%_-_36px)] max-[600px]:p-[18px_0_64px]`}>
        {ordersError && <p className="mb-5 text-sm text-red-800" role="alert">{ordersError}</p>}
        <section className={`orders-empty grid [justify-items:start] gap-3 p-9 border border-gray-200 bg-gray-50 [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:font-normal [&_h1]:m-0 [&_h1]:font-serif [&_h1]:text-3xl [&_h1]:font-normal [&_p]:m-[0_0_8px] [&_p]:text-gray-500`}>
          <h1>We couldn&apos;t find that order.</h1>
          <p>It may have been removed, or you may need to sign in to view it.</p>
          <Link className={`button button-dark bg-gray-900 text-white hover:bg-gray-700 min-h-[48px] inline-flex items-center justify-center gap-7 p-[0_20px] border-0 cursor-pointer text-sm font-semibold transition-[background_160ms_ease,_transform_160ms_ease] [&:hover]:-translate-y-px bg-gray-900 text-white [&:hover]:bg-gray-700`} href="/orders">
            View all orders
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={`orders-page w-[min(100%_-_56px,_1180px)] min-h-[60vh] m-[0_auto] p-[22px_0_84px] max-[600px]:w-[calc(100%_-_36px)] max-[600px]:p-[18px_0_64px]`}>
      <nav className={`catalog-breadcrumb flex flex-wrap items-center gap-2.5 mb-5 text-gray-500 text-sm [&_a:hover]:text-gray-900 [&_a:hover]:underline [&_a:hover]:underline-offset-3`} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/orders">Orders</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{order.id}</span>
      </nav>
      <header className={`order-confirmation-heading [&_h1]:m-[9px_0] [&_h1]:font-serif [&_h1]:text-[clamp(40px,_5vw,_58px)] [&_h1]:font-normal [&_h1]:tracking-[-2px] grid [justify-items:center] m-[24px_0_42px] p-[34px_20px] bg-gray-50 text-center [&_.eyebrow]:m-0 [&_>p:not(.eyebrow)]:m-[0_0_15px] [&_>p:not(.eyebrow)]:text-gray-500 [&_time]:text-gray-500 [&_time]:text-xs max-[600px]:m-[20px_0_28px] max-[600px]:p-[28px_16px]`}>
        <span className={`order-confirmation-check grid w-[48px] h-[48px] mb-4.5 place-items-center rounded-full bg-[#e8eee9] text-[#355342] text-2xl`} aria-hidden="true">✓</span>
        <p className={`eyebrow m-0 text-[var(--green)] text-[11px] font-bold tracking-[1.5px]`}>{orderStatusLabels[order.status ?? "received"].toUpperCase()}</p>
        <h1>Thank you, {order.contact.name.split(" ")[0]}.</h1>
        <p>Your order details are saved with the store.</p>
        <strong className={`order-confirmation-number mb-1.5 text-sm`}>{order.id}</strong>
        <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
      </header>

      <OrderTracking status={order.status ?? "received"} />
      <div className={`order-detail-layout grid grid-cols-[minmax(0,_1fr)_minmax(300px,_390px)] items-start gap-[clamp(32px,_6vw,_82px)] max-[760px]:grid-cols-1 max-[760px]:gap-6.5`}>
        <section className={`order-detail-items [&_>h2]:m-[0_0_22px] [&_>h2]:font-serif [&_>h2]:text-[27px] [&_>h2]:font-normal min-w-0`} aria-label="Items in your order">
          <h2>Items ordered</h2>
          {order.items.map((item) => (
            <article className={`order-detail-item grid grid-cols-[84px_minmax(0,_1fr)_auto] gap-[17px] items-start p-[17px_0] border-t border-[color:var(--line)] [&_img]:w-[84px] [&_img]:h-[96px] [&_img]:object-cover [&_h3]:m-[2px_0_5px] [&_h3]:font-serif [&_h3]:text-[19px] [&_h3]:font-normal [&_p]:block [&_p]:m-[0_0_7px] [&_p]:text-gray-500 [&_p]:text-xs [&_span]:block [&_span]:m-[0_0_7px] [&_span]:text-gray-500 [&_span]:text-xs [&_>strong]:text-[13px] max-[600px]:grid-cols-[68px_minmax(0,_1fr)_auto] max-[600px]:gap-[11px] max-[600px]:[&_img]:w-[68px] max-[600px]:[&_img]:h-[78px]`} key={item.id}>
              <Image src={item.images?.[0]?.url ?? item.image ?? ""} alt={item.alt ?? ""} width={84} height={96} unoptimized />
              <div>
                <h3>{item.name}</h3>
                {item.detail && <p>{item.detail}</p>}
                {item.variantForm && (
                  <p>
                    {item.variantForm} · {item.variantPotency ?? "Not specified"} ·{" "}
                    {item.variantPackageQuantity ?? "Package not specified"}
                  </p>
                )}
                <span>Quantity: {item.quantity}</span>
              </div>
              <strong>{formatPrice(item.price * item.quantity)}</strong>
            </article>
          ))}
          <div className={`order-detail-totals grid gap-[13px] mt-2.5 pt-[19px] border-t border-[color:#dfe3e8] [&_>div]:flex [&_>div]:justify-between [&_>div]:gap-3 [&_>div]:text-gray-600 [&_>div]:text-[13px] [&_.order-detail-total]:pt-[15px] [&_.order-detail-total]:border-t [&_.order-detail-total]:border-gray-200 [&_.order-detail-total]:text-[var(--ink)] [&_.order-detail-total]:text-base`}>
            <div><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></div>
            <div><span>Shipping</span><strong>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</strong></div>
            <div className="order-detail-total"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
          </div>
        </section>

        <aside className={`order-contact-card [&_>h2]:m-[0_0_22px] [&_>h2]:font-serif [&_>h2]:text-[27px] [&_>h2]:font-normal sticky top-[24px] p-[27px] border border-gray-200 bg-gray-50 [&_address]:grid [&_address]:gap-[9px] [&_address]:text-gray-600 [&_address]:text-sm [&_address]:not-italic [&_address]:leading-normal [&_address_strong]:text-[var(--ink)] [&_.demo-disclaimer]:mt-5 [&_.demo-disclaimer]:pt-[17px] [&_.demo-disclaimer]:border-t [&_.demo-disclaimer]:border-gray-200 [&_.demo-disclaimer]:leading-[1.6] [&_.demo-disclaimer]:text-left max-[760px]:static max-[600px]:p-[21px]`}>
          <h2>Contact and delivery</h2>
          <address>
            <strong>{order.contact.name}</strong>
            <span>{order.contact.email}</span>
            <span>{order.contact.phone}</span>
            <span>{order.contact.address}</span>
            <span>{order.contact.city}</span>
          </address>
          <p className={`demo-disclaimer block m-[14px_0_0] text-[#85877c] text-xs text-center`}>
            Order record only — no payment has been collected and no shipment has been created.
          </p>
        </aside>
      </div>
      <Link className={`text-link order-history-link inline-flex items-center gap-[11px] pb-[5px] border-b border-[color:#aeb1a6] text-[#434a40] text-[13px] transition-[gap_160ms_ease] [&:hover]:gap-4 mt-7`} href="/orders">
        View all orders <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}
