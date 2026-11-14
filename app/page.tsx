import { Suspense } from "react";
import Link from "next/link";
import { BrandLoading } from "./components/brand-loading";
import { HeroCarousel } from "./components/hero-carousel";
import { HomeMerchandising } from "./components/home-merchandising";
import { ProductGrid } from "./components/product-grid";
import {
  getCategories,
  getCategorySlug,
  getPrimaryProductImage,
} from "./lib/products";
import type { Product } from "./lib/products";
import { getServerProducts } from "./lib/server-products";

/* ------------------------------------------------------------------ */
/* Edit the banner copy and links here                                 */
/* ------------------------------------------------------------------ */

const promoBanner = {
  title: "Build a routine that sticks",
  text: "Start with the basics and add what you need, one step at a time.",
  cta: "Shop all supplements",
  href: "/shop",
};

const featureBanners = [
  {
    title: "Explore the shop",
    text: "Browse the full product catalog.",
    cta: "Shop all products",
    href: "/shop",
    tone: "bg-[var(--color-primary)]",
  },
  {
    title: "Shop by category",
    text: "Vitamins, minerals and more, all in one place.",
    cta: "Browse categories",
    href: "/shop",
    tone: "bg-[var(--color-secondary)]",
  },
];

const CATEGORY_SECTION_LIMIT = 3;

/* ------------------------------------------------------------------ */

const pageWidth =
  "mx-auto w-[min(100%_-_104px,_1440px)] max-[900px]:w-[calc(100%_-_56px)] max-[600px]:w-[calc(100%_-_32px)]";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-secondary)]";

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ProductSection({
  id,
  title,
  description,
  href,
  linkLabel = "Shop all",
  items,
}: {
  id: string;
  title: string;
  description?: string;
  href: string;
  linkLabel?: string;
  items: Product[];
}) {
  if (items.length === 0) return null;

  return (
    <section
      className={`${pageWidth} py-12 max-[600px]:py-9 lg:py-16`}
      id={id}
      aria-labelledby={`${id}-heading`}
    >
      <div className="mb-8 flex items-end justify-between gap-4 max-[600px]:mb-6">
        <div>
          <h2
            id={`${id}-heading`}
            className="m-0 text-[clamp(26px,3vw,34px)] font-medium leading-tight tracking-[-0.02em] text-[var(--color-text)]"
          >
            {title}
          </h2>
          {description && (
            <p className="mb-0 mt-2 text-[15px] text-[var(--color-text)]">
              {description}
            </p>
          )}
        </div>
        <Link
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[var(--color-secondary)] bg-[var(--color-white)] px-4 text-[13px] font-medium text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-background)] ${focusRing}`}
          href={href}
        >
          {linkLabel} <ArrowIcon />
        </Link>
      </div>
      <ProductGrid products={items} />
    </section>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<BrandLoading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const products = await getServerProducts();
  const featuredProducts = products.slice(0, 4);
  const categorySections = getCategories(products)
    .filter((category) => category.slug !== "all")
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      items: products
        .filter((product) => getCategorySlug(product.category) === category.slug)
        .slice(0, 4),
    }))
    .filter((section) => section.items.length > 0)
    .slice(0, CATEGORY_SECTION_LIMIT);

  return (
    <main>
      {/* Hero */}
      <div className={`${pageWidth} pt-6 max-[600px]:pt-4`}>
        <HeroCarousel
          images={featuredProducts
            .slice(0, 3)
            .map(getPrimaryProductImage)}
        />
      </div>

      {/* Backend catalog */}
      <ProductSection
        id="products"
        title="Shop supplements"
        description="Explore the products in our catalog."
        href="/shop"
        items={featuredProducts}
      />

      <HomeMerchandising initialProducts={products} />

      {/* Promo banner */}
      <section className={`${pageWidth} py-6`} aria-label={promoBanner.title}>
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6 rounded-3xl bg-[var(--color-primary)] px-10 py-12 text-[var(--color-white)] max-[600px]:px-6 max-[600px]:py-9">
          <div className="max-w-xl">
            <h2 className="m-0 text-[clamp(26px,3.4vw,40px)] font-medium leading-[1.12] tracking-[-0.02em]">
              {promoBanner.title}
            </h2>
            <p className="mb-0 mt-3 text-[15px] leading-7 text-[var(--color-white)]">
              {promoBanner.text}
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-[var(--color-white)] px-7 text-sm font-semibold text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href={promoBanner.href}
          >
            {promoBanner.cta} <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* Category sections, with the two-up banners after the first one */}
      {categorySections.map((section, index) => (
        <div key={section.slug}>
          <ProductSection
            id={`category-${section.slug}`}
            title={section.name}
            href={`/category/${section.slug}`}
            linkLabel="View all"
            items={section.items}
          />

          {index === 0 && (
            <section
              className={`${pageWidth} grid grid-cols-2 gap-5 py-6 max-[760px]:grid-cols-1 max-[600px]:gap-4`}
              aria-label="Featured collections"
            >
              {featureBanners.map((banner) => (
                <Link
                  key={banner.title}
                  href={banner.href}
                  className={`group flex min-h-[260px] flex-col justify-between rounded-3xl p-8 transition-colors max-[600px]:min-h-[220px] max-[600px]:p-6 ${banner.tone} ${focusRing}`}
                >
                  <div>
                    <h2 className="m-0 text-[clamp(24px,2.6vw,32px)] font-medium leading-tight tracking-[-0.02em] text-[var(--color-white)]">
                      {banner.title}
                    </h2>
                    <p className="mb-0 mt-3 max-w-[300px] text-[15px] leading-7 text-[var(--color-white)]">
                      {banner.text}
                    </p>
                  </div>
                  <span className="mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-[var(--color-white)] px-5 py-2.5 text-[13px] font-semibold text-[var(--color-secondary)] transition-all group-hover:gap-4">
                    {banner.cta} <ArrowIcon />
                  </span>
                </Link>
              ))}
            </section>
          )}
        </div>
      ))}

      {/* Closing banner */}
      <section className={`${pageWidth} pb-20 pt-10 max-[600px]:pb-14`}>
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6 rounded-3xl bg-[var(--color-background)] px-10 py-12 max-[600px]:px-6 max-[600px]:py-9">
          <h2 className="m-0 max-w-xl text-[clamp(26px,3.4vw,40px)] font-medium leading-[1.12] tracking-[-0.02em] text-[var(--color-text)]">
            Find your new daily essential.
          </h2>
          <Link
            className={`inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-[var(--color-secondary)] px-7 text-sm font-semibold text-[var(--color-white)] transition-colors hover:bg-[var(--color-primary)] ${focusRing}`}
            href="/shop"
          >
            Shop all supplements <ArrowIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}