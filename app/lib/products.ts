export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  variants: ProductVariant[];
};

export type ProductImage = {
  url: string;
  publicId?: string;
};

export type ProductSpecification = {
  key: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  form: string;
  potency: string;
  packageQuantity: string;
  portionSize?: string;
  totalServings?: string;
  bestBefore?: string;
  price: number;
  images: ProductImage[];
  detail?: string;
  rating?: number | null;
  tag?: string;
  type?: string;
  alt?: string;
  description?: string;
  benefits?: string[];
  ingredients?: string;
  howToUse?: string;
  warnings?: string;
  supplementInformation?: string;
  tone?: string;
  specifications?: ProductSpecification[];
};

export type ProductCategory = {
  name: string;
  slug: string;
  icon?: ProductCategoryIcon;
};

export const productCategories = [
  { name: "Vitamins & Minerals", icon: "pill" },
  { name: "Multivitamins", icon: "leaf" },
  { name: "Protein & Fitness", icon: "dumbbell" },
  { name: "Herbal Supplements", icon: "sprout" },
  { name: "Omega & Fish Oil", icon: "fish" },
  { name: "Digestive Health", icon: "activity" },
  { name: "Immune Support", icon: "shield-check" },
  { name: "Bone & Joint Health", icon: "bone" },
  { name: "Women's & Men's Health", icon: "heart" },
  { name: "Beauty & Wellness", icon: "sparkles" },
] as const;

export type ProductCategoryIcon =
  (typeof productCategories)[number]["icon"];

export function getVariantImages(
  _product: Product,
  variant: ProductVariant,
): ProductImage[] {
  return variant.images;
}

export function getPrimaryProductImage(product: Product): string {
  const variant = getStartingVariant(product);
  return getVariantImages(product, variant)[0]?.url ?? "";
}

export function getProductVariants(product: Product): ProductVariant[] {
  return product.variants;
}

export function getStartingPrice(product: Product): number {
  return getStartingVariant(product).price;
}

export function getStartingVariant(product: Product): ProductVariant {
  return getProductVariants(product).reduce((cheapest, variant) =>
    variant.price < cheapest.price ? variant : cheapest,
  );
}

export function getCategorySlug(categoryName: string): string {
  return categoryName
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProductVariantSlug(
  variant: ProductVariant,
  variants: ProductVariant[],
): string {
  const slug =
    [variant.form, variant.potency, variant.packageQuantity]
      .map(getCategorySlug)
      .filter(Boolean)
      .join("-") || getCategorySlug(variant.id) || "option";
  const duplicateCount = variants.filter(
    (candidate) =>
      [candidate.form, candidate.potency, candidate.packageQuantity]
        .map(getCategorySlug)
        .filter(Boolean)
        .join("-") === slug,
  ).length;

  return duplicateCount > 1
    ? `${slug}-${getCategorySlug(variant.id) || "option"}`
    : slug;
}

export function findProductVariant(
  variants: ProductVariant[],
  value?: string,
): ProductVariant | undefined {
  if (!value) return undefined;
  return (
    variants.find(({ id }) => id === value) ??
    variants.find(
      (variant) => getProductVariantSlug(variant, variants) === value,
    )
  );
}

export function getCategories(products: Product[]): ProductCategory[] {
  const categoriesBySlug = new Map<string, ProductCategory>();
  for (const product of products) {
    const slug = getCategorySlug(product.category);
    if (slug && !categoriesBySlug.has(slug)) {
      categoriesBySlug.set(slug, { name: product.category, slug });
    }
  }
  const configuredSlugs = new Set(
    productCategories.map(({ name }) => getCategorySlug(name)),
  );
  return [
    { name: "All supplements", slug: "all" },
    ...productCategories.map(({ name, icon }) => ({
      name,
      slug: getCategorySlug(name),
      icon,
    })),
    ...[...categoriesBySlug.values()]
      .filter((category) => !configuredSlugs.has(category.slug))
      .sort((left, right) => left.name.localeCompare(right.name)),
  ];
}

export function getProduct(
  id: string,
  products: Product[],
): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getCategory(
  slug: string,
  products: Product[],
): ProductCategory | undefined {
  return getCategories(products).find((category) => category.slug === slug);
}

export function getProductsInCategory(
  slug: string,
  products: Product[],
): Product[] {
  if (slug === "all") return products;
  return products.filter(
    (product) => getCategorySlug(product.category) === slug,
  );
}
