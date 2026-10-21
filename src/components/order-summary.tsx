import { Badge } from "@/components/ui/badge";
import type { Order, OrderStatus } from "@/lib/api/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { orderStatusLabel, orderStatusVariant } from "@/lib/orders";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={orderStatusVariant(status)}>{orderStatusLabel(status)}</Badge>;
}

export function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div data-field="status">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <OrderStatusBadge status={order.status} />
          </dd>
        </div>
        <div data-field="buyer">
          <dt className="text-muted-foreground">Buyer</dt>
          <dd className="mt-1">{order.buyerEmail}</dd>
        </div>
        <div data-field="date">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="mt-1">{formatDateTime(order.createdAt)}</dd>
        </div>
        <div data-field="amount">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="mt-1">{formatMoney(order.amount, order.currency)}</dd>
        </div>
        <div data-field="fee">
          <dt className="text-muted-foreground">Fee</dt>
          <dd className="mt-1">{formatMoney(order.fee, order.currency)}</dd>
        </div>
      </dl>
      <ul className="flex flex-col gap-3 border-t pt-4">
        {order.items.map((item) => (
          <li key={`${item.productId}-${item.unitPrice}`} className="flex items-start justify-between gap-3">
            <span>
              <span className="block font-medium">{item.title}</span>
              <span className="block text-xs text-muted-foreground">{item.productId}</span>
            </span>
            <span className="text-right">
              <span className="block">Qty {item.quantity}</span>
              <span className="block text-muted-foreground">{formatMoney(item.unitPrice, order.currency)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
