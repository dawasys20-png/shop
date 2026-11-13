"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { StoreNavigation } from "./store-navigation";

/*
  Palette under test
  primary #6D28D9, dark #4C1D95, light #F3E8FF, green #20A800, background #FAFAFA
  Footer sits on dark purple. Green button text is dark (#0B1F05) for contrast.
  Footer text tints: body #D9C8F5, muted #BBA6E3
*/

const footerColumns = [
  {
    heading: "Shop",
    label: "Shop links",
    links: [
      { href: "/shop", text: "Shop all" },
      { href: "/category/vitamins", text: "Vitamins" },
      { href: "/category/greens", text: "Greens" },
      { href: "/category/protein", text: "Protein" },
      { href: "/category/sleep", text: "Sleep" },
    ],
  },
  {
    heading: "Your account",
    label: "Your account links",
    links: [
      { href: "/orders", text: "Track an order" },
      { href: "/cart", text: "Shopping bag" },
      { href: "/login", text: "Log in" },
      { href: "/signup", text: "Create an account" },
    ],
  },
  {
    heading: "Explore",
    label: "Explore links",
    links: [
      { href: "/", text: "Home" },
      { href: "/admin", text: "Store admin" },
    ],
  },
];

const footerFocusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

function StoreFooter() {
  return (
    <footer className="mt-auto rounded-t-[2.5rem] bg-[#4C1D95] text-white max-[600px]:rounded-t-3xl">
      <div className="mx-auto grid w-[min(100%-2.5rem,80rem)] gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-14 lg:py-20">
        {/* Brand */}
        <div className="max-w-sm sm:col-span-2 lg:col-span-1">
          <Link
            className={`inline-flex items-center gap-3 text-[19px] font-semibold tracking-[-0.03em] ${footerFocusRing}`}
            href="/"
            aria-label="Form and Function home"
          >
            <span>Vitahub Ug</span>
          </Link>

          <p className="mb-0 mt-6 max-w-xs text-[15px] leading-7 text-[#D9C8F5]">
            Everyday wellness, made a little simpler. Thoughtful essentials for
            feeling good in your own rhythm.
          </p>

          <Link
            className="mt-7 inline-flex min-h-11 items-center gap-3 rounded-full bg-[#20A800] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2FC106] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href="/shop"
          >
            Find your feel-good
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {/* Link columns */}
        {footerColumns.map((column) => (
          <nav aria-label={column.label} key={column.heading}>
            <h2 className="m-0 text-[15px] font-semibold text-white">
              {column.heading}
            </h2>
            <ul className="m-0 mt-5 grid list-none gap-3.5 p-0 text-[14px]">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    className={`text-[#D9C8F5] underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:text-white hover:decoration-[#20A800] ${footerFocusRing}`}
                    href={link.href}
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-[min(100%-2.5rem,80rem)] flex-col gap-2 py-6 text-[13px] text-[#BBA6E3] sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">
            © {new Date().getFullYear()} Form &amp; Function. Feel good, for
            real.
          </p>
          <p className="m-0">Thoughtful essentials for your everyday.</p>
        </div>
      </div>
    </footer>
  );
}

function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showStoreChrome =
    !pathname.startsWith("/admin") && !pathname.startsWith("/delivery");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  if (!showStoreChrome) return children;

  return (
    <>
      <StoreNavigation />
      {children}
      <StoreFooter />
    </>
  );
}

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <RouteChrome>{children}</RouteChrome>
    </Suspense>
  );
}