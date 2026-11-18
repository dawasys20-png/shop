"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategories } from "../lib/products";
import { CategoryIcon } from "./category-icon";
import { useCatalog } from "./catalog-context";

export function CategoryNavigation() {
  const pathname = usePathname();
  const { products } = useCatalog();
  const categories = getCategories(products);

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
  className="border-b border-[#E9E1F5] bg-[#FAFAFA] px-4"
  aria-label="Supplement categories"
>
  <div
    className="mx-auto flex min-h-[56px] max-w-[1440px] items-stretch justify-start gap-6 overflow-x-auto px-6 scrollbar-none lg:gap-8 max-[600px]:min-h-[50px] max-[600px]:gap-5 max-[600px]:px-[18px] max-[600px]:[mask-image:linear-gradient(to_right,black_calc(100%_-_32px),transparent)]"
  >
    {categories.map((category) => {
      const href =
        category.slug === "all"
          ? "/shop"
          : `/category/${category.slug}`;

      return (
        <Link
          href={href}
          key={category.slug}
          className="flex shrink-0 items-center border-b-2 border-transparent px-3 text-[14px] font-medium text-[#333333] transition-colors duration-200 hover:border-[#20A800] hover:text-[#4C1D95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6D28D9]"
        >
          <CategoryIcon
            icon={category.icon}
            className="mr-2 size-4"
          />
          {category.name}
        </Link>
      );
    })}
  </div>
</nav>
  );
}
