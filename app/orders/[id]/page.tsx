import { Suspense } from "react";
import { BrandLoading } from "../../components/brand-loading";
import { OrderDetailPage } from "../../components/order-detail-page";

export default function OrderDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
  <Suspense fallback={<BrandLoading />}>
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
