"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { formatPrice, FREE_DELIVERY_THRESHOLD } from "../lib/currency";
import { apiRequest } from "../lib/api";
import type { CheckoutContact, PaymentMethod } from "../lib/orders";
import { getVariantImages } from "../lib/products";
import { useCart } from "./cart-context";

/*
  Palette under test
  primary #6D28D9, dark #4C1D95, light #F3E8FF, green #20A800, background #FAFAFA
  Green is for the place-order action, with dark text (#0B1F05): white on this
  green is too low contrast for small text.
  neutrals: body #4A4658, muted #6B6680, small labels #77728A, divider #E9E1F5, control border #E0D6F2
*/

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]";

const greenButton = `inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#20A800] px-7 text-sm font-semibold text-[#0B1F05] transition-colors hover:bg-[#2FC106] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

const labelClass = "grid gap-2 text-[13px] font-semibold text-[#4C1D95]";

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-[#E0D6F2] bg-white px-4 text-sm font-normal text-[#1F1B2E] outline-none transition-[border-color,box-shadow] placeholder:text-[#9A94AE] focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.15)]";

export function CheckoutPage() {
  const { cart, cartReady, ordersReady, itemCount, subtotal, shipping, placeOrder } =
    useCart();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (!cartReady || cart.length === 0) return;

    let active = true;
    apiRequest<{ user: object | null }>("/auth/me")
      .then(({ user }) => {
        if (!active) return;
        if (!user) {
          const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
          router.replace(`/login?${new URLSearchParams({ returnTo }).toString()}`);
          return;
        }
        setSessionChecked(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not verify sign-in before checkout.", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Could not verify your sign-in.",
        );
        setSessionChecked(true);
      });

    return () => {
      active = false;
    };
  }, [cart.length, cartReady, router]);

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
    const paymentMethodValue = formData.get("paymentMethod");
    if (
      paymentMethodValue !== "pay_on_delivery" &&
      paymentMethodValue !== "pay_now"
    ) {
      setErrorMessage("Please choose a payment method.");
      return;
    }
    const paymentMethod: PaymentMethod = paymentMethodValue;

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
      const { user } = await apiRequest<{ user: object | null }>("/auth/me");
      if (!user) {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        router.push(`/login?${new URLSearchParams({ returnTo }).toString()}`);
        return;
      }

      const order = await placeOrder(contact, paymentMethod);
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
    <main className="mx-auto min-h-[60vh] w-[min(100%_-_56px,_1180px)] pb-24 pt-6 max-[600px]:w-[calc(100%_-_32px)] max-[600px]:pb-16 max-[600px]:pt-5">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#77728A]"
        aria-label="Breadcrumb"
      >
        <Link className="transition-colors hover:text-[#6D28D9]" href="/">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link className="transition-colors hover:text-[#6D28D9]" href="/cart">
          Your bag
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#4C1D95]" aria-current="page">
          Checkout
        </span>
      </nav>

      {/* Page header */}
      <header className="mb-10 border-b border-[#E9E1F5] pb-8 max-[600px]:mb-6 max-[600px]:pb-6">
        <h1 className="m-0 text-[clamp(32px,4vw,44px)] font-medium leading-[1.1] tracking-[-0.025em] text-[#4C1D95]">
          Checkout
        </h1>
        <p className="mb-0 mt-2 text-[15px] text-[#6B6680]">
          Enter your contact and delivery details to place your order.
        </p>
      </header>

      {!cartReady || !ordersReady || (cart.length > 0 && !sessionChecked) ? (
        <div
          className="flex min-h-[300px] flex-col items-center justify-center"
          role="status"
          aria-label="Preparing your checkout"
        >
          <Image
            src="/logo.png"
            alt="VitaHub UG"
            width={160}
            height={160}
            className="h-40 w-40 animate-pulse object-contain"
          />
          <span className="sr-only">Preparing your checkout...</span>
        </div>
      ) : cart.length === 0 ? (
        <section className="grid justify-items-start gap-3 rounded-3xl bg-[#F3E8FF] p-10 max-[600px]:p-6">
          <h2 className="m-0 text-[26px] font-medium tracking-[-0.02em] text-[#4C1D95]">
            Your bag is empty.
          </h2>
          <p className="m-0 mb-2 text-[15px] text-[#6B6680]">
            Add something to your bag before checking out.
          </p>
          <Link className={greenButton} href="/shop">
            Explore essentials <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(300px,390px)] items-start gap-[clamp(32px,6vw,80px)] max-[760px]:grid-cols-1 max-[760px]:gap-7">
          {/* Contact and delivery */}
          <section className="min-w-0 rounded-3xl border border-[#E9E1F5] bg-white p-7 max-[600px]:p-5">
            <h2 className="m-0 mb-6 text-[24px] font-medium tracking-[-0.02em] text-[#4C1D95]">
              Contact and delivery
            </h2>
            <form className="grid gap-5" onSubmit={submitOrder}>
              <label className={labelClass}>
                Full name
                <input
                  className={inputClass}
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
                <label className={labelClass}>
                  Email address
                  <input
                    className={inputClass}
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label className={labelClass}>
                  Phone number
                  <input
                    className={inputClass}
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+256 7XX XXX XXX"
                    required
                  />
                </label>
              </div>
              <label className={labelClass}>
                Street address
                <input
                  className={inputClass}
                  name="address"
                  autoComplete="street-address"
                  placeholder="House number and street"
                  required
                />
              </label>
              <label className={labelClass}>
                City or town
                <input
                  className={inputClass}
                  name="city"
                  autoComplete="address-level2"
                  placeholder="City or town"
                  required
                />
              </label>

              <fieldset className="grid gap-3 border-0 p-0">
                <legend className={`${labelClass} mb-3`}>Payment method</legend>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E0D6F2] bg-white p-4 text-[13px] text-[#4A4658] transition-colors has-[:checked]:border-[#6D28D9] has-[:checked]:bg-[#F8F3FF]">
                  <input
                    className="mt-1 accent-[#6D28D9]"
                    type="radio"
                    name="paymentMethod"
                    value="pay_on_delivery"
                    required
                  />
                  <span className="grid gap-1">
                    <strong className="font-semibold text-[#1F1B2E]">
                      Pay on delivery
                    </strong>
                    <span>Pay when your order arrives.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E0D6F2] bg-white p-4 text-[13px] text-[#4A4658] transition-colors has-[:checked]:border-[#6D28D9] has-[:checked]:bg-[#F8F3FF]">
                  <input
                    className="mt-1 accent-[#6D28D9]"
                    type="radio"
                    name="paymentMethod"
                    value="pay_now"
                    required
                  />
                  <span className="grid gap-1">
                    <strong className="font-semibold text-[#1F1B2E]">
                      Pay now
                    </strong>
                    <span>Pay online when you place your order.</span>
                  </span>
                </label>
              </fieldset>

              {errorMessage && (
                <p
                  className="m-0 rounded-2xl border border-[#F0D3CF] bg-[#FBEFED] px-5 py-3.5 text-[13px] leading-6 text-[#9A443E]"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              <div className="rounded-2xl bg-[#F3E8FF] px-5 py-4 text-[13px] leading-[1.65] text-[#4A4658]">
                Your chosen payment method will be included with your order.
              </div>

              <button
                className={`${greenButton} min-h-[54px] w-full justify-between`}
                type="submit"
                disabled={!cartReady || !ordersReady || isSubmitting}
              >
                {isSubmitting ? "Placing order…" : "Place order"}{" "}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>

          {/* Order summary */}
          <aside
            className="sticky top-6 rounded-3xl bg-[#F3E8FF] p-7 max-[760px]:static max-[600px]:p-5"
            aria-label="Order summary"
          >
            <h2 className="m-0 mb-5 text-[24px] font-medium tracking-[-0.02em] text-[#4C1D95]">
              Your order
            </h2>

            <div className="grid border-t border-[#D8C5F5]">
              {cart.map(({ key, product, variant, quantity }) => (
                <div
                  className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-[#D8C5F5] py-4"
                  key={key}
                >
                  <Image
                    className="h-[66px] w-[58px] rounded-xl bg-white object-cover"
                    src={getVariantImages(product, variant)[0]?.url ?? ""}
                    alt=""
                    width={58}
                    height={66}
                    unoptimized
                  />
                  <div className="grid min-w-0 gap-1">
                    <strong className="text-[13px] font-semibold text-[#1F1B2E]">
                      {product.name}
                    </strong>
                    <span className="text-xs text-[#6B6680]">
                      {variant.form} · {variant.potency} · {variant.packageQuantity}
                    </span>
                    <span className="text-xs text-[#6B6680]">Qty {quantity}</span>
                  </div>
                  <strong className="text-[13px] font-semibold text-[#4C1D95]">
                    {formatPrice(variant.price * quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3.5 text-[13px] text-[#4A4658]">
              <div className="flex justify-between gap-3.5">
                <span>
                  {itemCount} {itemCount === 1 ? "item" : "items"} · Subtotal
                </span>
                <strong className="font-semibold text-[#1F1B2E]">
                  {formatPrice(subtotal)}
                </strong>
              </div>
              <div className="flex justify-between gap-3.5">
                <span>Delivery</span>
                <strong className="font-semibold text-[#1F1B2E]">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </strong>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3.5 border-t border-[#D8C5F5] pt-4">
                <span className="text-base font-medium text-[#4C1D95]">Total</span>
                <strong className="text-xl font-semibold text-[#4C1D95]">
                  {formatPrice(subtotal + shipping)}
                </strong>
              </div>
            </div>

            <p className="mb-0 mt-5 flex items-center justify-center gap-2 text-xs text-[#6B6680]">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-[#20A800]"
                aria-hidden="true"
              />
              Free delivery on orders {formatPrice(FREE_DELIVERY_THRESHOLD)}+
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}