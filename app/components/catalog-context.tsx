"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getProductVariants,
  products as defaultProducts,
  type Product,
  type ProductVariant,
} from "../lib/products";
import { apiRequest } from "../lib/api";

type CatalogContextValue = {
  products: Product[];
  ready: boolean;
  loadError: string | null;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

type CatalogSnapshot = {
  products: Product[];
  ready: boolean;
  loadError: string | null;
};

const serverSnapshot: CatalogSnapshot = {
  products: defaultProducts,
  ready: false,
  loadError: null,
};

let catalogSnapshot = serverSnapshot;
let initialized = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const isVariant = (variant: unknown): variant is ProductVariant => {
    if (typeof variant !== "object" || variant === null) return false;
    const option = variant as Record<string, unknown>;
    const optionalStringFields = [
      "detail",
      "tag",
      "type",
      "alt",
      "description",
      "ingredients",
      "howToUse",
      "warnings",
      "supplementInformation",
      "tone",
      "bestBefore",
    ];
    return (
      typeof option.id === "string" &&
      option.id.length > 0 &&
      typeof option.form === "string" &&
      typeof option.potency === "string" &&
      typeof option.packageQuantity === "string" &&
      typeof option.price === "number" &&
      Number.isFinite(option.price) &&
      option.price >= 0 &&
      optionalStringFields.every(
        (field) => option[field] === undefined || typeof option[field] === "string",
      ) &&
      (option.bestBefore === undefined ||
        /^\d{4}-\d{2}-\d{2}$/.test(option.bestBefore as string)) &&
      (option.rating === undefined ||
        option.rating === null ||
        (typeof option.rating === "number" &&
          Number.isFinite(option.rating) &&
          option.rating >= 0 &&
          option.rating <= 5)) &&
      (option.benefits === undefined ||
        (Array.isArray(option.benefits) &&
          option.benefits.every((benefit) => typeof benefit === "string"))) &&
      Array.isArray(option.images) &&
      option.images.length > 0 &&
      option.images.length <= 12 &&
      option.images.every(
        (image) =>
          typeof image === "object" &&
          image !== null &&
          "url" in image &&
          typeof image.url === "string" &&
          ("publicId" in image
            ? typeof image.publicId === "string"
            : true),
      )
    );
  };
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.category === "string" &&
    typeof record.brand === "string" &&
    Array.isArray(record.variants) &&
    record.variants.length > 0 &&
    record.variants.every(isVariant) &&
    new Set(record.variants.map((variant) => variant.id)).size ===
      record.variants.length
  );
}

function parseCatalog(value: unknown): Product[] {
  if (!Array.isArray(value) || !value.every(isProduct)) {
    throw new Error("The store API returned an invalid product catalog.");
  }
  const parsed = value as Product[];
  const ids = new Set(parsed.map((product) => product.id));
  if (ids.size !== parsed.length) {
    throw new Error("Saved product catalog contains duplicate IDs.");
  }
  return parsed.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    variants: getProductVariants(product),
  }));
}

function initializeCatalog() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  void apiRequest<{ products: unknown }>("/products")
    .then(({ products }) => {
      catalogSnapshot = {
        products: parseCatalog(products),
        ready: true,
        loadError: null,
      };
    })
    .catch((error: unknown) => {
      console.error("Could not load the store catalog.", error);
      catalogSnapshot = {
        products: defaultProducts,
        ready: true,
        loadError:
          error instanceof Error
            ? `${error.message} The original catalog is shown until it is available.`
            : "The product catalog could not be loaded. The original catalog is shown.",
      };
    })
    .finally(notifyListeners);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  initializeCatalog();
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return catalogSnapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

async function saveProduct(product: Product) {
  initializeCatalog();
  if (!catalogSnapshot.ready) throw new Error("The product catalog is still loading.");
  const exists = catalogSnapshot.products.some(({ id }) => id === product.id);
  const { product: savedProduct } = await apiRequest<{ product: Product }>(
    exists ? `/products/${encodeURIComponent(product.id)}` : "/products",
    {
      method: exists ? "PUT" : "POST",
      body: JSON.stringify(product),
    },
  );
  const next = catalogSnapshot.products.some(({ id }) => id === savedProduct.id)
    ? catalogSnapshot.products.map((item) =>
        item.id === savedProduct.id ? savedProduct : item,
      )
    : [...catalogSnapshot.products, savedProduct];
  catalogSnapshot = { products: next, ready: true, loadError: null };
  notifyListeners();
}

async function deleteProduct(productId: string) {
  initializeCatalog();
  if (!catalogSnapshot.ready) throw new Error("The product catalog is still loading.");
  await apiRequest<void>(`/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
  const next = catalogSnapshot.products.filter(({ id }) => id !== productId);
  catalogSnapshot = { products: next, ready: true, loadError: null };
  notifyListeners();
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used within CatalogProvider");
  return context;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo(
    () => ({
      ...snapshot,
      saveProduct,
      deleteProduct,
    }),
    [snapshot],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
