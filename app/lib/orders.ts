import type { ProductImage } from "./products";

export type CheckoutContact = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

export type OrderItem = {
  id: string;
  name: string;
  detail?: string;
  image?: string;
  alt?: string;
  price: number;
  images?: ProductImage[];
  quantity: number;
  variantId?: string;
  variantForm?: string;
  variantPotency?: string;
  variantPackageQuantity?: string;
};

export const orderStatuses = [
  "received",
  "processing",
  "shipped",
  "complete",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  received: "Received",
  processing: "Processing",
  shipped: "Shipped",
  complete: "Complete",
  cancelled: "Cancelled",
};

export type Order = {
  id: string;
  createdAt: string;
  status?: OrderStatus;
  contact: CheckoutContact;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

export const ORDERS_STORAGE_KEY = "form-function-orders";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isContact(value: unknown): value is CheckoutContact {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.phone === "string" &&
    typeof value.address === "string" &&
    typeof value.city === "string"
  );
}

function isOrderItem(value: unknown): value is OrderItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.detail === undefined || typeof value.detail === "string") &&
    (value.image === undefined || typeof value.image === "string") &&
    (value.alt === undefined || typeof value.alt === "string") &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    value.price >= 0 &&
    (value.images === undefined ||
      (Array.isArray(value.images) &&
        value.images.length > 0 &&
        value.images.length <= 12 &&
        value.images.every(
          (image) =>
            isRecord(image) &&
            typeof image.url === "string" &&
            (image.publicId === undefined || typeof image.publicId === "string"),
        ))) &&
    (value.variantId === undefined || typeof value.variantId === "string") &&
    (value.variantForm === undefined || typeof value.variantForm === "string") &&
    (value.variantPotency === undefined ||
      typeof value.variantPotency === "string") &&
    (value.variantPackageQuantity === undefined ||
      typeof value.variantPackageQuantity === "string") &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  );
}

function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    !Number.isNaN(Date.parse(value.createdAt)) &&
    (value.status === undefined ||
      (typeof value.status === "string" &&
        orderStatuses.includes(value.status as OrderStatus))) &&
    isContact(value.contact) &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(isOrderItem) &&
    typeof value.subtotal === "number" &&
    Number.isFinite(value.subtotal) &&
    typeof value.shipping === "number" &&
    Number.isFinite(value.shipping) &&
    typeof value.total === "number" &&
    Number.isFinite(value.total)
  );
}

export function readStoredOrders(): Order[] {
  const stored = window.localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved order history has an invalid format.");
  }
  return parsed.filter(isOrder);
}

export function writeStoredOrders(orders: Order[]) {
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}
