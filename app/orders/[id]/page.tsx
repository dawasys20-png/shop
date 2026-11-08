import { Suspense } from "react";
import { OrderDetailPage } from "../../components/order-detail-page";

export default function OrderDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className={`orders-page [width:min(100%_-_56px,_1180px)] [min-height:60vh] [margin:0_auto] [padding:22px_0_84px] max-[600px]:[width:calc(100%_-_36px)] max-[600px]:[padding:18px_0_64px]`}><p>Loading order…</p></main>}>
      <OrderDetails params={params} />
    </Suspense>
  );
}

async function OrderDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailPage orderId={id} />;
}
