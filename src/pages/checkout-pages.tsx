import type { ReactNode } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { OrderSummary } from "@/components/order-summary";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { useCheckoutSession } from "@/lib/api/hooks";
import { checkoutResultTitle } from "@/lib/orders";
import { usePageTitle } from "@/pages/use-page-title";

function CheckoutFrame({
  page,
  title,
  children,
}: {
  page: string;
  title: string;
  children: ReactNode;
}) {
  usePageTitle(title);

  return (
    <main data-page={page} className="flex min-h-svh bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="m-auto flex w-full max-w-lg flex-col">
        <div className="rounded-xl border bg-card p-8 text-card-foreground shadow-sm sm:p-10">
          <p className="font-heading text-2xl font-semibold tracking-tight">Loom</p>
          <h1 className="mt-6 font-heading text-xl font-semibold tracking-tight">{title}</h1>
          <div className="mt-6 flex flex-col gap-4">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function CheckoutSuccessPage() {
  const { tenantSlug = "" } = useParams();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const session = useCheckoutSession(tenantSlug, sessionId);
  const title = !sessionId
    ? "Checkout session missing"
    : session.data
      ? checkoutResultTitle(session.data.status)
      : "Checkout";

  return (
    <CheckoutFrame page="checkout-success" title={title}>
      {!sessionId ? <p>This link needs a session_id from checkout.</p> : null}
      {sessionId && session.isLoading ? <PageSkeleton /> : null}
      {sessionId && session.error ? <QueryError error={session.error} /> : null}
      {session.data ? (
        <div className="flex flex-col gap-4">
          <p data-field="store" className="text-muted-foreground">
            {session.data.storeName}
          </p>
          <OrderSummary order={session.data.order} />
        </div>
      ) : null}
    </CheckoutFrame>
  );
}

export function CheckoutCancelPage() {
  return (
    <CheckoutFrame page="checkout-cancel" title="Checkout canceled">
      <p>No payment was taken.</p>
    </CheckoutFrame>
  );
}
