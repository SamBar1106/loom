import { Link, useParams } from "react-router-dom";
import { useTenant } from "@/app/tenant-context";
import { OrderSummary } from "@/components/order-summary";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/lib/api/hooks";
import { tenantPath } from "@/lib/paths";
import { usePageTitle } from "@/pages/use-page-title";

export function OrderDetailPage() {
  const { tenant } = useTenant();
  const { orderId = "" } = useParams();
  const order = useOrder(tenant.id, orderId);
  usePageTitle(orderId ? `Order ${orderId}` : "Order");

  return (
    <div className="flex flex-col gap-4" data-page="order">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{orderId}</h1>
        <Button variant="outline" render={<Link to={tenantPath(tenant.slug, "orders")} />} nativeButton={false}>
          All orders
        </Button>
      </div>
      {order.isLoading ? <PageSkeleton /> : null}
      {order.error ? <QueryError error={order.error} /> : null}
      {order.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderSummary order={order.data} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
