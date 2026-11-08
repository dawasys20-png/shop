"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { categories } from "../lib/products";

export function CategoryNavigation() {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the active category visible when the row scrolls on small screens
  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    active?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  if (
    pathname.startsWith("/products/") ||
    pathname === "/cart" ||
    pathname.startsWith("/checkout") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/")
  ) {
    return null;
  }

  return (
    <nav
      className="border-b border-[#e3e7dd] bg-white"
      aria-label="Supplement categories"
    >
      <div
        ref={listRef}
        className="mx-auto flex min-h-[56px] max-w-[1440px] items-center justify-center gap-10 overflow-x-auto px-6 scrollbar-none lg:gap-14 max-[600px]:min-h-[50px] max-[600px]:justify-start max-[600px]:gap-7 max-[600px]:px-[18px] max-[600px]:[mask-image:linear-gradient(to_right,black_calc(100%_-_32px),transparent)]"
      >
        {categories.map((category) => {
          const href =
            category.slug === "all"
              ? "/shop"
              : `/category/${category.slug}`;

          const isActive =
            category.slug === "all"
              ? pathname === "/shop"
              : pathname === href ||
                pathname.startsWith(`${href}/`);

          return (
            <Link
              href={href}
              key={category.slug}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex h-[56px] shrink-0 items-center text-[14px] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#355342] max-[600px]:h-[50px] ${
                isActive
                  ? "font-semibold text-[#233b30]"
                  : "font-medium text-[#6f7a70] hover:text-[#233b30]"
              }`}
            >
              {category.name}

              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-[3px] origin-center rounded-t-full bg-[#355342] transition-transform duration-200 motion-reduce:transition-none ${
                  isActive
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-50"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}