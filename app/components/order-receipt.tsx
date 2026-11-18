"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "../lib/currency";
import { orderStatusLabels, type Order } from "../lib/orders";

function formatReceiptDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-UG", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(date);
}

export function PrintOrderReceipt({
  order,
  className,
}: {
  order: Order;
  className: string;
}) {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;

    function finishPrinting() {
      document.body.classList.remove("printing-order-receipt");
      setPrinting(false);
    }

    document.body.classList.add("printing-order-receipt");
    window.addEventListener("afterprint", finishPrinting);
    window.print();

    return () => {
      window.removeEventListener("afterprint", finishPrinting);
      document.body.classList.remove("printing-order-receipt");
    };
  }, [printing]);

  const status = order.status ?? "received";

  return (
    <>
      <button
        className={className}
        type="button"
        onClick={() => setPrinting(true)}
      >
        Print receipt
      </button>
      {printing &&
        typeof document !== "undefined" &&
        createPortal(
          <article
            className="receipt-print-target receipt-print-active"
          >
            <header className="receipt-header">
              <p className="receipt-brand">VitaHub Ug</p>
              <h1>Order receipt</h1>
              <p>Order {order.id}</p>
              <p>{formatReceiptDate(order.createdAt)}</p>
              <p>Status: {orderStatusLabels[status]}</p>
            </header>

            <section className="receipt-contact">
              <h2>Customer and delivery</h2>
              <p>{order.contact.name}</p>
              <p>{order.contact.email}</p>
              <p>{order.contact.phone}</p>
              <p>{order.contact.address}</p>
              <p>{order.contact.city}</p>
            </section>

            <table className="receipt-items">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr
                    key={`${item.id}-${item.variantId ?? ""}-${index}`}
                  >
                    <td>
                      <strong>{item.name}</strong>
                      {item.variantForm && (
                        <span className="receipt-item-detail">
                          {[item.variantForm, item.variantPotency, item.variantPackageQuantity]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="receipt-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
                </dd>
              </div>
              <div className="receipt-total">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <footer className="receipt-footer">
              Order record only — payment has not been collected.
            </footer>
          </article>,
          document.body,
        )}
    </>
  );
}
