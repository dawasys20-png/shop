
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getCategories } from "../lib/products";
import { useCatalog } from "./catalog-context";

export function CategoryNavigation() {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const { products } = useCatalog();
  const categories = getCategories(products);

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
      className="border-b border-[#E9E1F5] bg-[#FAFAFA]"
      aria-label="Supplement categories"
    >
      <div
        ref={listRef}
        className="mx-auto flex min-h-[56px] max-w-[1440px] items-center justify-center gap-3 overflow-x-auto px-6 scrollbar-none lg:gap-4 max-[600px]:min-h-[50px] max-[600px]:justify-start max-[600px]:gap-2 max-[600px]:px-[18px] max-[600px]:[mask-image:linear-gradient(to_right,black_calc(100%_-_32px),transparent)]"
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
              className={`flex h-[38px] shrink-0 items-center rounded-full px-5 text-[14px] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9] max-[600px]:h-[34px] max-[600px]:px-4 ${
                isActive
                  ? "bg-[#20A800] font-semibold text-white shadow-sm"
                  : "font-medium text-[#6B6680] hover:bg-[#F0EAF9] hover:text-[#4C1D95]"
              }`}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
