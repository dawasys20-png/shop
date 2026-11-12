"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getProductVariants,
  getStartingVariant,
  type Product,
  type ProductVariant,
} from "../lib/products";
import {
  type CheckoutContact,
  type Order,
  type OrderStatus,
} from "../lib/orders";
import { apiRequest } from "../lib/api";
import { useCatalog } from "./catalog-context";

type CartLine = {
  key: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
};
type StoredCartLine = { id: string; variantId: string; quantity: number };
type CartSnapshot = { lines: StoredCartLine[]; ready: boolean };
type OrdersSnapshot = { orders: Order[]; ready: boolean; error: string | null };
type CartContextValue = {
  cart: CartLine[];
  cartReady: boolean;
  orders: Order[];
  ordersReady: boolean;
  ordersError: string | null;
  itemCount: number;
  subtotal: number;
  shipping: number;
  addToCart: (product: Product, quantity?: number, variantId?: string) => void;
  changeQuantity: (lineKey: string, change: number) => void;
  placeOrder: (contact: CheckoutContact) => Promise<Order>;
  saveOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "form-function-cart";
const GUEST_ORDER_TOKENS_KEY = "form-function-order-access";
const serverCartSnapshot: CartSnapshot = { lines: [], ready: false };
const serverOrdersSnapshot: OrdersSnapshot = { orders: [], ready: false, error: null };

let cartSnapshot = serverCartSnapshot;
let ordersSnapshot = serverOrdersSnapshot;
let cartInitialized = false;
let ordersInitialized = false;
let storageListenerAttached = false;
const cartListeners = new Set<() => void>();
const ordersListeners = new Set<() => void>();

function notify(listeners: Set<() => void>) {
  listeners.forEach((listener) => listener());
}

function parseCart(value: string | null): StoredCartLine[] {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved shopping bag has an invalid format.");
  }
  return parsed.flatMap((line): StoredCartLine[] => {
    if (
      typeof line !== "object" ||
      line === null ||
      !("id" in line) ||
      !("quantity" in line) ||
      typeof line.id !== "string" ||
      typeof line.quantity !== "number" ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1
    ) {
      return [];
    }
    return [{
      id: line.id,
      variantId:
        "variantId" in line && typeof line.variantId === "string"
          ? line.variantId
          : "",
      quantity: line.quantity,
    }];
  });
}

function initializeCart() {
  if (cartInitialized || typeof window === "undefined") return;
  cartInitialized = true;
  try {
    cartSnapshot = {
      lines: parseCart(window.localStorage.getItem(CART_STORAGE_KEY)),
      ready: true,
    };
  } catch (error) {
    console.error("Could not restore the saved shopping bag.", error);
    cartSnapshot = { lines: [], ready: true };
  }
  notify(cartListeners);
}

function readGuestOrderTokens(): { id: string; token: string }[] {
  try {
    const stored = window.localStorage.getItem(GUEST_ORDER_TOKENS_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          "id" in entry &&
          "token" in entry &&
          typeof entry.id === "string" &&
          typeof entry.token === "string",
      )
    ) {
      throw new Error("Saved guest order access data is invalid.");
    }
    return parsed;
  } catch (error) {
    console.error("Could not restore guest order access data.", error);
    return [];
  }
}

function syncStorage(event: StorageEvent) {
  if (event.key === CART_STORAGE_KEY) {
    try {
      cartSnapshot = {
        lines: parseCart(event.newValue),
        ready: true,
      };
      cartInitialized = true;
      notify(cartListeners);
    } catch (error) {
      console.error("Could not sync the saved shopping bag.", error);
    }
  }
}

async function refreshOrders() {
  const [accountOrders, guestOrders] = await Promise.all([
    apiRequest<{ orders: Order[] }>("/orders"),
    apiRequest<{ orders: Order[] }>("/orders/lookup", {
      method: "POST",
      body: JSON.stringify({ tokens: readGuestOrderTokens() }),
    }),
  ]);
  const byId = new Map<string, Order>();
  for (const order of [...accountOrders.orders, ...guestOrders.orders]) {
    byId.set(order.id, order);
  }
  ordersSnapshot = {
    orders: [...byId.values()].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    ),
    ready: true,
    error: null,
  };
  ordersInitialized = true;
  notify(ordersListeners);
}

function initializeOrders() {
  if (ordersInitialized || typeof window === "undefined") return;
  ordersInitialized = true;
  void refreshOrders().catch((error: unknown) => {
    console.error("Could not load orders from the store API.", error);
    ordersSnapshot = {
      orders: [],
      ready: true,
      error:
        error instanceof Error
          ? error.message
          : "Orders could not be loaded from the store API.",
    };
    notify(ordersListeners);
  });
}

function subscribeCart(listener: () => void) {
  cartListeners.add(listener);
  initializeCart();
  if (!storageListenerAttached && typeof window !== "undefined") {
    window.addEventListener("storage", syncStorage);
    storageListenerAttached = true;
  }
  return () => cartListeners.delete(listener);
}

function subscribeOrders(listener: () => void) {
  ordersListeners.add(listener);
  initializeOrders();
  return () => ordersListeners.delete(listener);
}

function getCartSnapshot() {
  return cartSnapshot;
}

function getOrdersSnapshot() {
  return ordersSnapshot;
}

function getServerCartSnapshot() {
  return serverCartSnapshot;
}

function getServerOrdersSnapshot() {
  return serverOrdersSnapshot;
}

function writeCart(lines: StoredCartLine[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  cartInitialized = true;
  cartSnapshot = { lines, ready: true };
  notify(cartListeners);
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, ready: catalogReady } = useCatalog();
  const storedCart = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const storedOrders = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getServerOrdersSnapshot,
  );

  const cart = useMemo(
    () =>
      storedCart.lines.flatMap((line): CartLine[] => {
        const product = products.find(({ id }) => id === line.id);
        if (!product) return [];
        const variants = getProductVariants(product);
        const variant =
          variants.find(({ id }) => id === line.variantId) ??
          getStartingVariant(product);
        return variant
          ? [{
              key: `${product.id}:${variant.id}`,
              product,
              variant,
              quantity: line.quantity,
            }]
          : [];
      }),
    [products, storedCart.lines],
  );

  const itemCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce(
    (total, line) => total + line.variant.price * line.quantity,
    0,
  );
  const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 5;

  const addToCart = useCallback(
    (product: Product, quantity = 1, variantId?: string) => {
      if (!catalogReady) throw new Error("The product catalog is still loading.");
      const currentProduct = products.find(({ id }) => id === product.id);
      if (!currentProduct) throw new Error("This product is no longer available.");
      const variants = getProductVariants(currentProduct);
      const variant =
        variants.find(({ id }) => id === variantId) ??
        getStartingVariant(currentProduct);
      if (!variant) throw new Error("This product has no available purchase options.");
      const existing = storedCart.lines.find(
        (line) =>
          line.id === currentProduct.id &&
          (line.variantId || getStartingVariant(currentProduct).id) === variant.id,
      );
      const next = existing
        ? storedCart.lines.map((line) =>
            line.id === currentProduct.id &&
            (line.variantId || getStartingVariant(currentProduct).id) === variant.id
              ? { ...line, quantity: line.quantity + quantity }
              : line,
          )
        : [...storedCart.lines, {
            id: currentProduct.id,
            variantId: variant.id,
            quantity,
          }];
      writeCart(next);
    },
    [catalogReady, products, storedCart.lines],
  );

  const changeQuantity = useCallback(
    (lineKey: string, change: number) => {
      const next = storedCart.lines
        .map((line) => {
          const product = products.find(({ id }) => id === line.id);
          const variants = product ? getProductVariants(product) : [];
          const variantId =
            variants.find(({ id }) => id === line.variantId)?.id ??
            (product ? getStartingVariant(product).id : undefined) ??
            "";
          return {
            ...line,
            quantity:
              `${line.id}:${variantId}` === lineKey
                ? line.quantity + change
                : line.quantity,
          };
        })
        .filter((line) => line.quantity > 0);
      writeCart(next);
    },
    [products, storedCart.lines],
  );

  const placeOrder = useCallback(
    async (contact: CheckoutContact) => {
      if (!catalogReady || !storedCart.ready || !storedOrders.ready) {
        throw new Error("Your saved shopping bag is still loading.");
      }
      if (cart.length === 0) {
        throw new Error("Add an item to your bag before placing an order.");
      }
      const { order, accessToken } = await apiRequest<{
        order: Order;
        accessToken: string | null;
      }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          contact,
          items: cart.map(({ product, variant, quantity }) => ({
            productId: product.id,
            variantId: variant.id,
            quantity,
          })),
        }),
      });
      if (accessToken) {
        const tokens = readGuestOrderTokens().filter(({ id }) => id !== order.id);
        tokens.unshift({ id: order.id, token: accessToken });
        window.localStorage.setItem(
          GUEST_ORDER_TOKENS_KEY,
          JSON.stringify(tokens.slice(0, 50)),
        );
      }
      writeCart([]);
      ordersSnapshot = {
        orders: [order, ...ordersSnapshot.orders.filter(({ id }) => id !== order.id)],
        ready: true,
        error: null,
      };
      ordersInitialized = true;
      notify(ordersListeners);
      return order;
    },
    [
      catalogReady,
      storedCart.ready,
      storedOrders.ready,
      cart,
    ],
  );

  const saveOrder = useCallback(
    async (order: Order) => {
      if (!storedOrders.ready) throw new Error("Saved orders are still loading.");
      const exists = storedOrders.orders.some(({ id }) => id === order.id);
      const { order: savedOrder } = await apiRequest<{ order: Order }>(
        exists
          ? `/admin/orders/${encodeURIComponent(order.id)}`
          : "/admin/orders",
        {
          method: exists ? "PUT" : "POST",
          body: JSON.stringify({
            ...order,
            items: order.items.map((item) => ({
              productId: item.id,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          }),
        },
      );
      ordersSnapshot = {
        orders: [
          savedOrder,
          ...storedOrders.orders.filter(({ id }) => id !== savedOrder.id),
        ],
        ready: true,
        error: null,
      };
      notify(ordersListeners);
    },
    [storedOrders.orders, storedOrders.ready],
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      if (!storedOrders.ready) throw new Error("Saved orders are still loading.");
      await apiRequest<void>(`/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "DELETE",
      });
      ordersSnapshot = {
        orders: storedOrders.orders.filter(({ id }) => id !== orderId),
        ready: true,
        error: null,
      };
      notify(ordersListeners);
    },
    [storedOrders.orders, storedOrders.ready],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (!storedOrders.ready) throw new Error("Saved orders are still loading.");
      const { order: updatedOrder } = await apiRequest<{ order: Order }>(
        `/admin/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      ordersSnapshot = {
        ...ordersSnapshot,
        orders: ordersSnapshot.orders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      };
      notify(ordersListeners);
    },
    [storedOrders.ready],
  );

  const reloadOrders = useCallback(async () => {
    try {
      await refreshOrders();
    } catch (error) {
      ordersSnapshot = {
        ...ordersSnapshot,
        ready: true,
        error:
          error instanceof Error
            ? error.message
            : "Orders could not be loaded from the store API.",
      };
      ordersInitialized = true;
      notify(ordersListeners);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      cart,
      cartReady: catalogReady && storedCart.ready,
      orders: storedOrders.orders,
      ordersReady: storedOrders.ready,
      ordersError: storedOrders.error,
      itemCount,
      subtotal,
      shipping,
      addToCart,
      changeQuantity,
      placeOrder,
      saveOrder,
      updateOrderStatus,
      deleteOrder,
      refreshOrders: reloadOrders,
    }),
    [
      cart,
      catalogReady,
      storedCart.ready,
      storedOrders.orders,
      storedOrders.ready,
      storedOrders.error,
      itemCount,
      subtotal,
      shipping,
      addToCart,
      changeQuantity,
      placeOrder,
      saveOrder,
      updateOrderStatus,
      deleteOrder,
      reloadOrders,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
