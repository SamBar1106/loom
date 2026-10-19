import { ShoppingBagIcon } from "lucide-react";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
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
import { formatMoney, formatRelative } from "@/lib/format";
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
            <EmptyDescription>
              This tenant has no sample orders. When an order arrives it will be listed here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {orders.data && orders.data.data.length > 0 ? (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.number}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.status}</Badge>
                  </TableCell>
                  <TableCell>{formatMoney(order.total, order.currency)}</TableCell>
                  <TableCell>{formatRelative(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
