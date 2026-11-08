import {
  orderStatusLabels,
  type OrderStatus,
} from "../lib/orders";

const orderStages: OrderStatus[] = ["received", "processing", "shipped", "complete"];

export function OrderTracking({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className={`order-tracking-cancelled m-[10px_0] p-[10px_12px] bg-[#fbefed] text-[#9a443e] text-xs`} role="status">
        This order has been cancelled.
      </p>
    );
  }

  const activeStage = orderStages.indexOf(status);

  return (
    <ol
      className={`order-tracking grid grid-cols-4 m-0 p-[16px_8px_12px] list-none [&_li]:relative [&_li]:flex [&_li]:min-w-0 [&_li]:flex-col [&_li]:items-center [&_li]:gap-[7px] [&_li]:text-[#8a8e86] [&_li]:text-[11px] [&_li]:text-center [&_li::before]:absolute [&_li::before]:z-0 [&_li::before]:top-[5px] [&_li::before]:right-[50%] [&_li::before]:w-full [&_li::before]:h-[2px] [&_li::before]:bg-[#e2e5df] [&_li::before]:content-[''] [&_li.complete::before]:bg-[var(--green)] [&_li:first-child::before]:hidden [&_li.complete]:text-[#3e5944] [&_li.complete_.order-tracking-dot]:border-[color:var(--green)] [&_li.complete_.order-tracking-dot]:bg-[var(--green)] max-[600px]:pr-0 max-[600px]:pl-0 max-[600px]:[&_li]:text-[9px]`}
      aria-label={`Order tracking: ${orderStatusLabels[status]}`}
    >
      {orderStages.map((stage, index) => (
        <li
          className={index <= activeStage ? "complete" : ""}
          aria-current={index === activeStage ? "step" : undefined}
          key={stage}
        >
          <span className={`order-tracking-dot relative z-10 w-[12px] h-[12px] border border-[color:#c9cec6] rounded-full bg-white`} aria-hidden="true" />
          <span>{orderStatusLabels[stage]}</span>
        </li>
      ))}
    </ol>
  );
}
