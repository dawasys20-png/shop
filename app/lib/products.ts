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

export type ProductVariant = {
  id: string;
  form: string;
  potency: string;
  packageQuantity: string;
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
};

export const products: Product[] = [
  {
    id: "daily-greens",
    name: "Daily Greens",
    variants: [{
      id: "greens-powder-30",
      form: "Powder",
      potency: "Not specified",
      packageQuantity: "30 servings",
      price: 38,
      detail: "Superfood blend · 30 servings",
      rating: 4.8,
      tag: "BEST SELLER",
      type: "Greens powder",
      images: [{ url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=85" }],
      alt: "Fresh greens and colorful produce",
      description: "A simple daily greens blend made to bring a little more plant variety to your routine. Bright, easy to mix, and thoughtfully formulated for everyday use.",
      benefits: ["A convenient serving of greens", "Easy to add to your morning routine", "30 servings per pouch"],
      ingredients: "Organic leafy greens, spirulina, chlorella, and natural citrus flavor.",
      howToUse: "Mix one scoop into 8–10 oz of cold water or your favorite smoothie.",
      supplementInformation: "Demo catalog information. Refer to the product packaging for verified serving sizes and full supplement facts.",
    }],
    category: "Greens",
    brand: "Form & Function",
  },
  {
    id: "magnesium",
    name: "Magnesium, PM",
    variants: [{
      id: "magnesium-capsules-60",
      form: "Capsules",
      potency: "Not specified",
      packageQuantity: "60 capsules",
      price: 28,
      detail: "Magnesium glycinate · 60 capsules",
      rating: 4.7,
      tag: "SLEEP SUPPORT",
      type: "Magnesium",
      images: [{ url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=85" }],
      alt: "Wellness supplements arranged in soft light",
      description: "A gentle magnesium glycinate formula for your evening wind-down. A clear, uncomplicated capsule made to fit into the routine you already have.",
      benefits: ["Magnesium in glycinate form", "An easy evening routine", "60 capsules per bottle"],
      ingredients: "Magnesium bisglycinate, vegetable capsule, and rice flour.",
      howToUse: "Take two capsules in the evening with water, or follow your healthcare professional's advice.",
      supplementInformation: "Demo catalog information. Refer to the product packaging for verified serving sizes and full supplement facts.",
    }],
    category: "Sleep",
    brand: "Dayform",
  },
  {
    id: "daily-protein",
    name: "Daily Protein",
    variants: [{
      id: "protein-powder-20",
      form: "Powder",
      potency: "Not specified",
      packageQuantity: "20 servings",
      price: 42,
      detail: "Vanilla plant protein · 20 servings",
      rating: 4.6,
      tag: "PLANT POWER",
      type: "Plant protein",
      images: [{ url: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=85" }],
      alt: "A nourishing smoothie made with plant-based ingredients",
      description: "A smooth, plant-based vanilla protein that makes an easy addition to breakfast, post-workout smoothies, or wherever your day takes you.",
      benefits: ["Plant-based protein blend", "Smooth vanilla flavor", "20 servings per pouch"],
      ingredients: "Pea protein, pumpkin seed protein, natural vanilla, and sea salt.",
      howToUse: "Shake one scoop with 10–12 oz of water or your preferred milk.",
      supplementInformation: "Demo catalog information. Refer to the product packaging for verified serving sizes and full supplement facts.",
    }],
    category: "Protein",
    brand: "Form & Function",
  },
  {
    id: "omega-3",
    name: "Omega-3",
    variants: [{
      id: "omega-3-softgels-30",
      form: "Softgels",
      potency: "Not specified",
      packageQuantity: "30 softgels",
      price: 32,
      detail: "Algae oil · 30 softgels",
      rating: 4.8,
      tag: "DAILY ESSENTIAL",
      type: "Omega-3",
      images: [{ url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85" }],
      alt: "Minimal skincare and wellness bottles",
      description: "A plant-based omega-3 made with algae oil, a considered everyday alternative to fish oil. Easy-to-take softgels with no fishy aftertaste.",
      benefits: ["Plant-based algae oil", "No fishy aftertaste", "30 softgels per bottle"],
      ingredients: "Algal oil with DHA and EPA, tapioca starch, and glycerin.",
      howToUse: "Take one softgel daily with a meal.",
      supplementInformation: "Demo catalog information. Refer to the product packaging for verified serving sizes and full supplement facts.",
    }],
    category: "Vitamins",
    brand: "Goodwell",
  },
  {
    id: "vitamin-c",
    name: "Vitamin C",
    variants: [{
      id: "vitamin-c-capsules-60",
      form: "Capsules",
      potency: "Not specified",
      packageQuantity: "60 capsules",
      price: 24,
      detail: "Citrus vitamin C · 60 capsules",
      rating: 4.7,
      tag: "DAILY ESSENTIAL",
      type: "Vitamin C",
      images: [{ url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=85" }],
      alt: "A bottle of daily vitamin supplements",
      description: "A straightforward vitamin C capsule with a short ingredient list, made for a simple, consistent daily routine.",
      benefits: ["One-a-day capsule", "60 servings per bottle", "Simple, transparent formula"],
      ingredients: "Ascorbic acid, vegetable capsule, and rice flour.",
      howToUse: "Take one capsule daily with food.",
      supplementInformation: "Demo catalog information. Refer to the product packaging for verified serving sizes and full supplement facts.",
    }],
    category: "Vitamins",
    brand: "Goodwell",
  },
  {
    id: "vitamin-d3",
    name: "Vitamin D3",
    variants: [{
      id: "vitamin-d3-softgels-60",
      form: "Softgels",
      potency: "Not specified",
      packageQuantity: "60 softgels",
      price: 26,
      detail: "Plant-based D3 · 60 softgels",
      rating: 4.6,
      tag: "PLANT BASED",
      type: "Vitamin D3",
      images: [{ url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85" }],
      alt: "Minimal bottle of plant-based vitamin supplements",
      description: "Plant-based vitamin D3 in an easy-to-take softgel. A no-fuss formula designed to fit into your everyday routine.",
      benefits: ["Plant-based source", "60 softgels per bottle", "Easy daily serving"],
      ingredients: "Lichen-derived vitamin D3, olive oil, and softgel capsule.",
      howToUse: "Take one softgel daily with a meal.",
      supplementInformation: "Demo catalog information. Refer to the product packaging for verified serving sizes and full supplement facts.",
    }],
    category: "Vitamins",
    brand: "Dayform",
  },
  {
    id: "b-complex",
    name: "B-Complex",
    variants: [{
      id: "b-complex-capsules-60",
      form: "Capsules",
      potency: "Not specified",
      packageQuantity: "60 capsules",
      price: 29,
      detail: "Everyday B vitamins · 60 capsules",
      rating: 4.8,
      tag: "DAILY ESSENTIAL",
      type: "B-Complex",
      images: [{ url: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?auto=format&fit=crop&w=900&q=85" }],
      alt: "Daily vitamins alongside fresh botanicals",
      description: "A balanced blend of B vitamins in one simple capsule, with a clear label and an easy daily serving.",
      benefits: ["A blend of essential B vitamins", "60 capsules per bottle", "Straightforward daily serving"],
      ingredients: "B vitamin blend, vegetable capsule, and rice flour.",
      howToUse: "Take one capsule daily with food.",
      supplementInformation: "Demo catalog information. Refer to the product packaging for verified serving sizes and full supplement facts.",
    }],
    category: "Vitamins",
    brand: "Form & Function",
  },
];

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

export const categories = [
  { name: "All supplements", slug: "all" },
  { name: "Vitamins", slug: "vitamins" },
  { name: "Herbal", slug: "herbal" },
  { name: "Protein", slug: "protein" },
  { name: "Sleep", slug: "sleep" },
  {name: "Longetivity", slug: "longetivity"}
];

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getProductsInCategory(slug: string) {
  if (slug === "all") return products;
  const category = getCategory(slug);
  return category
    ? products.filter((product) => product.category === category.name)
    : [];
}
