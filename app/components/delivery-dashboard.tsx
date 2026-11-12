"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";
import { formatPrice } from "../lib/currency";
import {
  orderStatusLabels,
  orderStatuses,
  type Order,
  type OrderStatus,
} from "../lib/orders";
import { useCart } from "./cart-context";

export function DeliveryDashboard() {
  const { orders, ordersReady, ordersError, refreshOrders, updateOrderStatus } =
    useCart();
  const router = useRouter();
  const [access, setAccess] = useState<"checking" | "allowed" | "error">("checking");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ user: { role: string } | null }>("/auth/me")
      .then(({ user }) => {
        if (!active) return;
        if (user?.role !== "delivery") {
          router.replace(user?.role === "admin" ? "/admin" : "/delivery/login");
          return;
        }
        void refreshOrders()
          .then(() => {
            if (active) setAccess("allowed");
          })
          .catch((error: unknown) => {
            if (!active) return;
            setMessage(
              error instanceof Error ? error.message : "Orders could not be loaded.",
            );
            setMessageIsError(true);
            setAccess("error");
          });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof Error ? error.message : "Delivery access could not be checked.",
        );
        setMessageIsError(true);
        setAccess("error");
      });

    return () => {
      active = false;
    };
  }, [refreshOrders, router]);

  async function changeStatus(order: Order, status: OrderStatus) {
    setUpdatingOrderId(order.id);
    setMessage("");
    setMessageIsError(false);
    try {
      await updateOrderStatus(order.id, status);
      setMessage(`Order ${order.id} updated to ${orderStatusLabels[status]}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The order status could not be updated.",
      );
      setMessageIsError(true);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function signOut() {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
      router.replace("/delivery/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
      setMessageIsError(true);
    }
  }

  if (access === "checking") {
    return (
      <main className="mx-auto min-h-[60vh] w-[min(100%_-_40px,_1100px)] py-16 text-center">
        <p role="status">Checking delivery team access…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[70vh] w-[min(100%_-_40px,_1100px)] pb-20 pt-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[#e3e7dd] pb-6">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#52715d]">
            Delivery team
          </p>
          <h1 className="m-0 font-serif text-4xl font-normal text-[#233b30]">
            Orders
          </h1>
          <p className="mb-0 mt-2 text-sm text-[#6f7a70]">
            View order and delivery details, and update order progress.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center rounded-full border border-[#dfe4d8] bg-white px-5 text-[13px] font-medium text-[#355342] hover:bg-[#f3f5ef]"
          type="button"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </header>

      {message && (
        <p
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            messageIsError
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-[#d5e0d6] bg-[#edf1eb] text-[#2e5b3e]"
          }`}
          role={access === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {access === "error" ? (
        <Link className="text-sm text-[#355342] underline" href="/delivery/login">
          Return to delivery sign in
        </Link>
      ) : !ordersReady ? (
        <p className="py-10 text-sm text-[#6f7a70]" role="status">
          Loading orders…
        </p>
      ) : ordersError ? (
        <p className="rounded border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
          {ordersError}
        </p>
      ) : orders.length === 0 ? (
        <p className="border border-[#dce4dc] bg-[#f3f6f2] p-8 text-sm text-[#6f7a70]">
          There are no orders to show yet.
        </p>
      ) : (
        <section className="grid gap-5" aria-label="Orders for delivery">
          {orders.map((order) => (
            <article
              className="grid gap-5 border border-[#dce4dc] bg-white p-5 sm:p-7"
              key={order.id}
            >
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e3e7dd] pb-4">
                <div>
                  <h2 className="m-0 text-lg font-semibold text-[#233b30]">
                    Order {order.id}
                  </h2>
                  <p className="mb-0 mt-1 text-xs text-[#6f7a70]">
                    {new Intl.DateTimeFormat("en-UG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(order.createdAt))}
                  </p>
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-xs font-semibold text-[#3f5848]"
                    htmlFor={`delivery-status-${order.id}`}
                  >
                    Order status
                  </label>
                  <select
                    id={`delivery-status-${order.id}`}
                    className="min-h-11 rounded-xl border border-[#cbd6cc] bg-white px-3 text-sm text-[#233b30] outline-none focus:border-[#355342] focus:ring-2 focus:ring-[#355342]/15"
                    value={order.status ?? "received"}
                    disabled={updatingOrderId !== null}
                    onChange={(event) => {
                      const status = orderStatuses.find(
                        (candidate) => candidate === event.currentTarget.value,
                      );
                      if (status) void changeStatus(order, status);
                    }}
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {orderStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  {updatingOrderId === order.id && (
                    <span className="text-xs text-[#6f7a70]" role="status">
                      Saving…
                    </span>
                  )}
                </div>
              </header>

              <div className="grid gap-5 sm:grid-cols-2">
                <section>
                  <h3 className="mb-2 mt-0 text-sm font-semibold text-[#233b30]">
                    Delivery details
                  </h3>
                  <address className="grid gap-1 text-sm not-italic leading-5 text-[#536157]">
                    <strong className="font-medium text-[#233b30]">{order.contact.name}</strong>
                    <span>{order.contact.phone}</span>
                    <span>{order.contact.address}</span>
                    <span>{order.contact.city}</span>
                    <span>{order.contact.email}</span>
                  </address>
                </section>
                <section>
                  <h3 className="mb-2 mt-0 text-sm font-semibold text-[#233b30]">
                    Items · {formatPrice(order.total)}
                  </h3>
                  <ul className="m-0 grid list-none gap-2 p-0 text-sm text-[#536157]">
                    {order.items.map((item, index) => (
                      <li
                        className="flex justify-between gap-4"
                        key={`${item.id}-${item.variantId ?? ""}-${index}`}
                      >
                        <span>
                          {item.name}
                          {item.variantForm ? ` · ${item.variantForm}` : ""}
                          {" · "}Qty {item.quantity}
                        </span>
                        <strong className="whitespace-nowrap">
                          {formatPrice(item.price * item.quantity)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
