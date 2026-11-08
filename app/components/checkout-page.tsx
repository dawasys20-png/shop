"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatPrice } from "../lib/currency";
import type { CheckoutContact } from "../lib/orders";
import { getVariantImages } from "../lib/products";
import { useCart } from "./cart-context";

export function CheckoutPage() {
  const { cart, cartReady, ordersReady, itemCount, subtotal, shipping, placeOrder } =
    useCart();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const contact: CheckoutContact = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
    };
    if (
      !contact.name ||
      !contact.email ||
      !contact.phone ||
      !contact.address ||
      !contact.city
    ) {
      setErrorMessage("Please complete all contact and delivery fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await placeOrder(contact);
      router.push(`/orders/${encodeURIComponent(order.id)}`);
    } catch (error) {
      console.error("Could not place the order.", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't save your order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`checkout-page w-[min(100%_-_56px,_1180px)] min-h-[60vh] m-[0_auto] p-[22px_0_84px] max-[600px]:w-[calc(100%_-_36px)] max-[600px]:p-[18px_0_64px]`}>
      <nav className={`catalog-breadcrumb flex flex-wrap items-center gap-2.5 mb-5 text-[#68756b] text-sm [&_a:hover]:text-[#355342] [&_a:hover]:underline [&_a:hover]:underline-offset-3`} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/cart">Your bag</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Checkout</span>
      </nav>

      <div className={`checkout-page-heading m-[30px_0_28px] border-l-4 border-[#355342] bg-[#e8eee9] px-6 py-6 text-[#233b30] [&_h1]:m-[9px_0] [&_h1]:font-serif [&_h1]:text-[clamp(40px,_5vw,_58px)] [&_h1]:font-normal [&_h1]:tracking-[-2px] [&_>p:last-child]:text-[#536157] [&_>p:last-child]:text-[15px] sm:px-8 sm:py-7 max-[600px]:m-[24px_0_22px]`}>
        <p className={`eyebrow m-0 text-[#52715d] text-[11px] font-bold tracking-[1.5px]`}>ALMOST THERE</p>
        <h1>Checkout</h1>
        <p>Enter your contact and delivery details to place your order.</p>
      </div>

      {!cartReady || !ordersReady ? (
        <p className={`cart-page-loading p-[48px_0] text-gray-500 text-[15px]`} role="status">Preparing your checkout…</p>
      ) : cart.length === 0 ? (
        <section className={`checkout-empty grid [justify-items:start] gap-3 p-9 border border-[#dce4dc] bg-[#f3f6f2] [&_h2]:m-0 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:font-normal [&_h2]:text-[#233b30] [&_p]:m-[0_0_8px] [&_p]:text-[#68756b]`}>
          <h2>Your bag is empty.</h2>
          <p>Add something to your bag before checking out.</p>
          <Link className={`button button-dark min-h-[48px] inline-flex items-center justify-center gap-7 p-[0_20px] border-0 cursor-pointer text-sm font-semibold transition-[background_160ms_ease,_transform_160ms_ease] [&:hover]:-translate-y-px bg-[#355342] text-white [&:hover]:bg-[#233b30]`} href="/shop">
            Explore essentials <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <div className={`checkout-page-layout grid grid-cols-[minmax(0,_1fr)_minmax(300px,_390px)] items-start gap-[clamp(32px,_6vw,_82px)] max-[760px]:grid-cols-1 max-[760px]:gap-6.5`}>
          <section className={`checkout-contact-panel min-w-0 border-t-2 border-[#355342] bg-[#f3f6f2] p-6 pt-[21px] [&_>h2]:m-[0_0_22px] [&_>h2]:font-serif [&_>h2]:text-[27px] [&_>h2]:font-normal [&_>h2]:text-[#233b30] max-[600px]:p-5`}>
            <h2>Contact and delivery</h2>
            <form className={`checkout-form checkout-page-form grid gap-[15px] [&_label]:grid [&_label]:gap-[7px] [&_label]:text-[#3f5848] [&_label]:text-xs [&_label]:font-semibold [&_input]:w-full [&_input]:h-[44px] [&_input]:p-[0_12px] [&_input]:border [&_input]:border-[#cbd6cc] [&_input]:rounded-none [&_input]:outline-none [&_input]:bg-white [&_input]:text-[var(--ink)] [&_input]:text-sm [&_input:focus]:border-[#355342] [&_input:focus]:shadow-[0_0_0_2px_rgb(53_83_66_/_12%)] gap-5 [&_label]:gap-2 [&_label]:text-[13px] [&_input]:h-[50px] [&_.checkout-button]:min-h-[54px] [&_.checkout-button]:p-[0_18px]`} onSubmit={submitOrder}>
              <label>
                Full name
                <input name="name" autoComplete="name" placeholder="Your name" required />
              </label>
              <div className={`checkout-field-row grid grid-cols-2 gap-4 max-[600px]:grid-cols-1 max-[600px]:gap-5`}>
                <label>
                  Email address
                  <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                </label>
                <label>
                  Phone number
                  <input name="phone" type="tel" autoComplete="tel" placeholder="+256 7XX XXX XXX" required />
                </label>
              </div>
              <label>
                Street address
                <input name="address" autoComplete="street-address" placeholder="House number and street" required />
              </label>
              <label>
                City or town
                <input name="city" autoComplete="address-level2" placeholder="City or town" required />
              </label>

              {errorMessage && (
                <p className={`checkout-error m-0 p-[12px_14px] bg-red-50 text-red-800 text-[13px]`} role="alert">{errorMessage}</p>
              )}

              <div className={`checkout-demo-note border border-[#dce4dc] bg-[#e8eee9] p-[14px_16px] text-[#3f5848] text-[13px] leading-[1.65]`}>
                Payment is not collected here. Your order details are securely saved with the store.
              </div>
              <button
                className={`button button-dark checkout-button min-h-[48px] inline-flex items-center justify-center gap-7 p-[0_20px] border-0 cursor-pointer text-sm font-semibold transition-[background_160ms_ease,_transform_160ms_ease] [&:hover]:-translate-y-px bg-[#355342] text-white [&:hover]:bg-[#233b30] w-full justify-between`}
                type="submit"
                disabled={!cartReady || !ordersReady || isSubmitting}
              >
                {isSubmitting ? "Placing order…" : "Place order"} <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>

          <aside className={`checkout-order-summary [&_>h2]:m-[0_0_22px] [&_>h2]:font-serif [&_>h2]:text-[27px] [&_>h2]:font-normal [&_>h2]:text-[#233b30] sticky top-[24px] p-[27px] border border-[#dce4dc] bg-[#f3f6f2] [&_>h2]:mb-4 [&_.checkout-assurance]:mt-4 [&_.checkout-assurance]:text-xs max-[760px]:static max-[600px]:p-[21px]`} aria-label="Order summary">
            <h2>Your order</h2>
            <div className={`checkout-order-items grid border-t border-[#cbd6cc]`}>
              {cart.map(({ key, product, variant, quantity }) => (
                <div className={`checkout-order-item grid grid-cols-[58px_minmax(0,_1fr)_auto] items-center gap-[13px] p-[15px_0] border-b border-[#cbd6cc] [&_img]:w-[58px] [&_img]:h-[66px] [&_img]:object-cover [&_img]:bg-[#e8eee9] [&_>div]:grid [&_>div]:gap-[5px] [&_strong]:text-[13px] [&_strong]:font-semibold [&_strong]:text-[#233b30] [&_span]:text-[#68756b] [&_span]:text-xs`} key={key}>
                  <Image src={getVariantImages(product, variant)[0]?.url ?? ""} alt="" width={58} height={66} unoptimized />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{variant.form} · {variant.potency} · {variant.packageQuantity}</span>
                    <span>Qty {quantity}</span>
                  </div>
                  <strong>{formatPrice(variant.price * quantity)}</strong>
                </div>
              ))}
            </div>
            <div className={`checkout-summary-totals grid gap-3.5 pt-[19px] [&_>div]:flex [&_>div]:justify-between [&_>div]:gap-3.5 [&_>div]:text-[#536157] [&_>div]:text-[13px] [&_strong]:text-[#233b30] [&_strong]:font-semibold [&_.checkout-summary-total]:mt-1 [&_.checkout-summary-total]:pt-[17px] [&_.checkout-summary-total]:border-t [&_.checkout-summary-total]:border-[#cbd6cc] [&_.checkout-summary-total]:text-[#233b30] [&_.checkout-summary-total]:text-base [&_.checkout-summary-total_strong]:text-[17px]`}>
              <div><span>{itemCount} {itemCount === 1 ? "item" : "items"} · Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div><span>Shipping</span><strong>{shipping === 0 ? "Free" : formatPrice(shipping)}</strong></div>
              <div className="checkout-summary-total"><span>Total</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
            </div>
            <p className={`checkout-assurance m-[11px_0_0] text-[#85877c] text-xs text-center`}>Free shipping on orders UGX 60+</p>
          </aside>
        </div>
      )}
    </main>
  );
}
