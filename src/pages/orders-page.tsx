import { Link } from "react-router-dom";
import { ShoppingBagIcon } from "lucide-react";
import { useTenant } from "@/app/tenant-context";
import { OrderStatusBadge } from "@/components/order-summary";
import { PageSkeleton, QueryError } from "@/components/query-state";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders } from "@/lib/api/hooks";
import { formatDateTime, formatMoney } from "@/lib/format";
import { tenantPath } from "@/lib/paths";
import { usePageTitle } from "@/pages/use-page-title";

export function OrdersPage() {
  const { tenant } = useTenant();
  const orders = useOrders(tenant.id);
  usePageTitle("Orders");

  return (
    <div className="flex flex-col gap-4" data-page="orders">
      <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Orders</h1>
      {orders.isLoading ? <PageSkeleton /> : null}
      {orders.error ? <QueryError error={orders.error} /> : null}
      {orders.data && orders.data.data.length === 0 ? (
        <Empty className="min-h-80 bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingBagIcon />
            </EmptyMedia>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>Orders from checkout will be listed here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {orders.data && orders.data.data.length > 0 ? (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      to={tenantPath(tenant.slug, `orders/${order.id}`)}
                      className="flex min-h-11 items-center font-medium"
                    >
                      {order.id}
                    </Link>
                  </TableCell>
                  <TableCell>{order.buyerEmail}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>{formatMoney(order.amount, order.currency)}</TableCell>
                  <TableCell>{formatMoney(order.fee, order.currency)}</TableCell>
                  <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
