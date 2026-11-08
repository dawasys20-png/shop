"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "../lib/currency";
import { getVariantImages } from "../lib/products";
import { useCart } from "./cart-context";

export function CartPage() {
  const { cart, cartReady, subtotal, shipping, changeQuantity } =
    useCart();

  return (
    <main className={`cart-page w-[min(100%_-_56px,_1240px)] min-h-[60vh] m-[0_auto] p-[24px_0_88px] max-[600px]:w-[calc(100%_-_36px)] max-[600px]:p-[18px_0_64px] pt-5 max-[650px]:w-[calc(100%_-_36px)] max-[650px]:p-[18px_0_64px]`}>
      <nav className={`catalog-breadcrumb flex flex-wrap items-center gap-2.5 mb-5 text-[#68756b] text-sm [&_a:hover]:text-[#355342] [&_a:hover]:underline [&_a:hover]:underline-offset-3`} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Your bag</span>
      </nav>
      <header className="mb-7 border-l-4 border-[#355342] bg-[#e8eee9] px-6 py-6 text-[#233b30] sm:px-8 sm:py-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#52715d]">
          A little goodness, gathered
        </p>
        <h1 className="mb-0 text-3xl font-medium tracking-tight sm:text-4xl">Your bag</h1>
      </header>

      {!cartReady ? (
        <p className={`cart-page-loading p-[48px_0] text-gray-500 text-[15px]`} role="status">Loading your bag…</p>
      ) : cart.length === 0 ? (
        <section className={`empty-cart cart-page-empty flex flex-[1] flex-col items-center justify-center pb-20 text-center [&_h3]:mb-[7px] [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-normal [&_p]:mb-[21px] [&_p]:text-[#68756b] [&_p]:text-xs min-h-[400px] p-7 [&_h2]:m-[0_0_7px] [&_h2]:font-serif [&_h2]:text-[29px] [&_h2]:font-normal [&_h2]:text-[#233b30] [&_p]:text-sm border border-[#dce4dc] bg-[#f3f6f2]`}>
          <span className={`empty-bag grid w-[60px] h-[60px] mb-5 place-items-center rounded-full bg-[#e0e9e1] text-[#355342]`} aria-hidden="true">
            <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8h14l1 12H4L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
          </span>
          <h2>Your bag is taking a breather.</h2>
          <p>Find something good for your everyday.</p>
          <Link className={`button button-dark min-h-[48px] inline-flex items-center justify-center gap-7 p-[0_20px] border-0 cursor-pointer text-sm font-semibold transition-[background_160ms_ease,_transform_160ms_ease] [&:hover]:-translate-y-px bg-[#355342] text-white [&:hover]:bg-[#233b30]`} href="/shop">
            Explore essentials <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <div className={`cart-page-layout grid grid-cols-[minmax(0,_1fr)_minmax(300px,_380px)] items-start gap-[clamp(32px,_6vw,_88px)] max-[600px]:grid-cols-1 max-[600px]:gap-6 max-[800px]:grid-cols-[minmax(0,_1fr)_minmax(270px,_320px)] max-[800px]:gap-6 max-[650px]:grid-cols-1 max-[650px]:gap-6`}>
          <section className={`cart-page-items [&_.cart-item]:grid-cols-[128px_minmax(0,_1fr)_auto] [&_.cart-item]:gap-6 [&_.cart-item]:p-[24px_0] [&_.cart-item>a_img]:block [&_.cart-item>a_img]:w-[128px] [&_.cart-item>a_img]:h-[144px] [&_.cart-item>a_img]:object-cover [&_.cart-item>a_img]:bg-gray-100 [&_.cart-item-copy_h2]:m-[2px_0_7px] [&_.cart-item-copy_h2]:font-serif [&_.cart-item-copy_h2]:text-[23px] [&_.cart-item-copy_h2]:font-normal [&_.cart-item-copy_h2]:text-[#233b30] [&_.cart-item-copy_p]:mb-4.5 [&_.cart-item-copy_p]:text-[13px] max-[600px]:[&_.cart-item]:grid-cols-[76px_minmax(0,_1fr)_auto] max-[600px]:[&_.cart-item]:gap-3 max-[600px]:[&_.cart-item>a_img]:w-[76px] max-[600px]:[&_.cart-item>a_img]:h-[86px] max-[600px]:[&_.cart-item-copy_h2]:text-[17px] min-w-0 border-t border-[#cbd6cc] [&_.cart-item]:items-start [&_.cart-item>a_img]:transition-[opacity_160ms_ease] [&_.cart-item>a:hover_img]:opacity-[0.88] [&_.cart-item-copy_h2]:mt-[3px] [&_.cart-item-copy_p]:text-[#68756b] [&_.quantity-control]:h-[34px] [&_.quantity-control]:border-[#cbd6cc] [&_.quantity-control_button]:w-[34px] [&_.quantity-control_button]:h-[32px] [&_.quantity-control_button]:text-[17px] [&_.quantity-control_button]:text-[#355342] [&_.quantity-control_span]:min-w-[28px] [&_.quantity-control_span]:text-[13px] max-[800px]:[&_.cart-item]:grid-cols-[96px_minmax(0,_1fr)_auto] max-[800px]:[&_.cart-item]:gap-4 max-[800px]:[&_.cart-item>a_img]:w-[96px] max-[800px]:[&_.cart-item>a_img]:h-[112px] max-[650px]:[&_.cart-item]:grid-cols-[76px_minmax(0,_1fr)_auto] max-[650px]:[&_.cart-item]:gap-3 max-[650px]:[&_.cart-item]:p-[18px_0] max-[650px]:[&_.cart-item>a_img]:w-[76px] max-[650px]:[&_.cart-item>a_img]:h-[90px] max-[650px]:[&_.cart-item-copy_h2]:text-[17px] max-[650px]:[&_.cart-item-copy_p]:mb-3 max-[650px]:[&_.cart-item-copy_p]:text-[11px] max-[650px]:[&_.quantity-control]:h-[30px] max-[650px]:[&_.quantity-control_button]:w-[29px] max-[650px]:[&_.quantity-control_button]:h-[28px]`} aria-label="Items in your bag">
            {cart.map(({ key, product, variant, quantity }) => (
              <article className={`cart-item grid grid-cols-[76px_1fr_auto] gap-3.5 p-[19px_0] border-b border-[color:var(--line)] [&_>img]:w-[76px] [&_>img]:h-[86px] [&_>img]:object-cover [&_>img]:bg-gray-100 [&_>strong]:pt-[3px] [&_>strong]:text-sm [&_>strong]:font-medium`} key={key}>
                <Link href={`/products/${product.id}`} aria-label={`View ${product.name}`}>
                  <Image src={getVariantImages(product, variant)[0]?.url ?? ""} alt={variant.alt ?? ""} width={110} height={124} unoptimized />
                </Link>
                <div className={`cart-item-copy [&_h3]:m-[2px_0_5px] [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-normal [&_p]:m-[0_0_10px] [&_p]:text-[#77796f] [&_p]:text-xs`}>
                  <h2><Link href={`/products/${product.id}`}>{product.name}</Link></h2>
                  {variant.detail && <p>{variant.detail}</p>}
                  <p className="mb-3 text-xs text-[#68756b]">
                    {variant.form} · {variant.potency} · {variant.packageQuantity}
                  </p>
                  <div className={`quantity-control inline-flex h-[27px] items-center border border-[color:var(--line)] [&_button]:grid [&_button]:w-[27px] [&_button]:h-[25px] [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:cursor-pointer [&_span]:min-w-[20px] [&_span]:text-[13px] [&_span]:text-center`} aria-label={`${product.name} quantity`}>
                    <button type="button" onClick={() => changeQuantity(key, -1)} aria-label={`Decrease ${product.name} quantity`}>−</button>
                    <span>{quantity}</span>
                    <button type="button" onClick={() => changeQuantity(key, 1)} aria-label={`Increase ${product.name} quantity`}>+</button>
                  </div>
                </div>
                <strong className={`cart-page-line-price pt-[5px] text-[15px] font-medium max-[600px]:text-xs max-[650px]:text-xs`}>{formatPrice(variant.price * quantity)}</strong>
              </article>
            ))}
          </section>

          <aside className={`cart-page-summary p-7 bg-[#f3f6f2] [&_>h2]:m-[0_0_13px] [&_>h2]:font-serif [&_>h2]:text-[27px] [&_>h2]:font-normal [&_>h2]:text-[#233b30] [&_.shipping-note]:min-h-[67px] [&_.shipping-note]:text-xs [&_.cart-summary]:pt-5 sticky top-[24px] border border-[#dce4dc] [&_>h2]:mb-4.5 [&_.shipping-note]:text-[#536157] [&_.cart-summary>div]:mb-[15px] [&_.cart-summary>div]:text-[13px] [&_.cart-summary_.cart-total]:m-[19px_0_22px] [&_.cart-summary_.cart-total]:pt-[17px] [&_.cart-summary_.cart-total]:border-t [&_.cart-summary_.cart-total]:border-[#cbd6cc] [&_.cart-summary_.cart-total]:text-base [&_.cart-summary_.cart-total_strong]:text-[17px] [&_.checkout-button]:min-h-[52px] [&_.checkout-button]:p-[0_18px] max-[650px]:static max-[650px]:p-5.5`} aria-label="Order summary">
            <h2>Order summary</h2>
            <div className={`shipping-note flex min-h-[51px] flex-wrap items-center gap-[7px] text-[#54594f] text-sm`}>
              {shipping === 0 ? (
                <>You unlocked free shipping!</>
              ) : (
                <>You&apos;re {formatPrice(60 - subtotal)} away from free shipping.</>
              )}
              <span className={`shipping-progress w-full h-[3px] bg-[#dce4dc] [&_span]:block [&_span]:h-full [&_span]:bg-[#52715d] [&_span]:transition-[width_180ms_ease]`} aria-hidden="true">
                <span style={{ width: `${Math.min((subtotal / 60) * 100, 100)}%` }} />
              </span>
            </div>
            <div className={`cart-summary pt-[15px] border-t border-[color:var(--line)] [&_>div]:flex [&_>div]:justify-between [&_>div]:mb-3 [&_>div]:text-[#64665d] [&_>div]:text-sm [&_strong]:text-[var(--ink)] [&_strong]:font-medium [&_.cart-total]:m-[16px_0_18px] [&_.cart-total]:text-[var(--ink)] [&_.cart-total]:text-[17px] [&_.cart-total_strong]:text-lg`}>
              <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div><span>Shipping</span><strong>{shipping === 0 ? "Free" : formatPrice(shipping)}</strong></div>
              <div className="cart-total"><span>Total</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
              <Link className={`button button-dark checkout-button min-h-[48px] inline-flex items-center justify-center gap-7 p-[0_20px] border-0 cursor-pointer text-sm font-semibold transition-[background_160ms_ease,_transform_160ms_ease] [&:hover]:-translate-y-px bg-[#355342] text-white [&:hover]:bg-[#233b30] w-full justify-between`} href="/checkout">
                Continue to checkout <span aria-hidden="true">→</span>
              </Link>
              <p className={`checkout-assurance m-[11px_0_0] text-[#85877c] text-xs text-center`}>Demo checkout · Free shipping over UGX 60</p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
