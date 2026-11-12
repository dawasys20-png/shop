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
