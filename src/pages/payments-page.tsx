import { BanknoteIcon, WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStartStripeOnboarding, useStripeAccount, useStripeBalance, useStripePayouts } from "@/lib/api/hooks";
import type { StripeAccount, StripeBalance, StripeMoney, StripePayout } from "@/lib/api/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { tenantPath } from "@/lib/paths";
import {
  stripeBalanceView,
  stripeConnectAction,
  stripeConnectLabel,
  stripePayoutStatusLabel,
  stripePayoutStatusVariant,
  stripePayoutsView,
  type StripeAsyncView,
} from "@/lib/stripe-connect";
import { usePageTitle } from "@/pages/use-page-title";

function StatusRow({
  status,
  label,
  on,
  onLabel,
  offLabel,
}: {
  status: string;
  label: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <li data-status={status} className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <Badge variant={on ? "positive" : "secondary"}>{on ? onLabel : offLabel}</Badge>
    </li>
  );
}

function StripeConnection({ account }: { account: StripeAccount }) {
  const { tenant } = useTenant();
  const connect = useStartStripeOnboarding(tenant.id);
  const action = stripeConnectAction(account);
  const label = stripeConnectLabel(action);
  const returnUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}${tenantPath(tenant.slug, "settings/payments")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe</CardTitle>
        <CardDescription>Stripe hosts onboarding. This page does not collect secret keys.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">
          {account.id ? (
            <>
              Connected account <span className="font-mono text-foreground">{account.id}</span>
            </>
          ) : (
            "No Stripe account connected."
          )}
        </p>
        <ul className="flex flex-col gap-3">
          <StatusRow
            status="charges"
            label="Charges enabled"
            on={account.chargesEnabled}
            onLabel="Enabled"
            offLabel="Not enabled"
          />
          <StatusRow
            status="payouts"
            label="Payouts enabled"
            on={account.payoutsEnabled}
            onLabel="Enabled"
            offLabel="Not enabled"
          />
          <StatusRow
            status="details"
            label="Details submitted"
            on={account.detailsSubmitted}
            onLabel="Submitted"
            offLabel="Not submitted"
          />
        </ul>
      </CardContent>
      <CardFooter>
        {label ? (
          <Button
            disabled={connect.isPending}
            onClick={() =>
              connect.mutate(
                { accountId: account.id, returnUrl, refreshUrl: returnUrl },
                {
                  onSuccess: (url) => {
                    window.location.assign(url);
                  },
                  onError: (error) => {
                    toast.error(error instanceof Error ? error.message : "Could not open Stripe.");
                  },
                },
              )
            }
          >
            {label}
          </Button>
        ) : (
          <p>Charges and payouts are enabled.</p>
        )}
      </CardFooter>
    </Card>
  );
}

function moneyLabel(amounts: StripeMoney[]): string {
  if (amounts.length === 0) return "—";
  return amounts.map((item) => formatMoney(item.amount, item.currency)).join(", ");
}

function BalanceBody({ view }: { view: StripeAsyncView<StripeBalance> }) {
  switch (view.status) {
    case "loading":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      );
    case "error":
      return <QueryError error={view.error} />;
    case "empty":
      return (
        <Empty className="min-h-40 bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WalletIcon />
            </EmptyMedia>
            <EmptyTitle>No balance</EmptyTitle>
          </EmptyHeader>
        </Empty>
      );
    case "ready":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Available</CardDescription>
              <CardTitle data-field="available" className="text-2xl font-semibold">
                {moneyLabel(view.value.available)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Pending</CardDescription>
              <CardTitle data-field="pending" className="text-2xl font-semibold">
                {moneyLabel(view.value.pending)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      );
    default: {
      const unreachable: never = view;
      return unreachable;
    }
  }
}

function PayoutsBody({ view }: { view: StripeAsyncView<StripePayout[]> }) {
  switch (view.status) {
    case "loading":
      return <Skeleton className="h-40 w-full" />;
    case "error":
      return <QueryError error={view.error} />;
    case "empty":
      return (
        <Empty className="min-h-40 bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BanknoteIcon />
            </EmptyMedia>
            <EmptyTitle>No payouts</EmptyTitle>
          </EmptyHeader>
        </Empty>
      );
    case "ready":
      return (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.value.map((payout) => (
                <TableRow key={payout.id} data-payout={payout.id}>
                  <TableCell className="font-mono">{payout.id}</TableCell>
                  <TableCell>{formatMoney(payout.amount, payout.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={stripePayoutStatusVariant(payout.status)}>
                      {stripePayoutStatusLabel(payout.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(payout.arrivalDate)}</TableCell>
                  <TableCell>{formatDateTime(payout.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    default: {
      const unreachable: never = view;
      return unreachable;
    }
  }
}

export function PaymentsPage() {
  const { tenant } = useTenant();
  const account = useStripeAccount(tenant.id);
  const balance = useStripeBalance(tenant.id);
  const payouts = useStripePayouts(tenant.id);
  usePageTitle("Accept payments");
  const balanceView = stripeBalanceView(balance);
  const payoutsView = stripePayoutsView(payouts);

  return (
    <div className="flex max-w-5xl flex-col gap-6" data-page="payments">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Accept payments</h1>
        <p className="text-muted-foreground">Connect Stripe so {tenant.name} can accept charges and payouts.</p>
      </div>
      <Alert>
        <AlertTitle>No secrets on this screen</AlertTitle>
        <AlertDescription>
          Provider credentials stay on the API. Loom never asks for secret keys in the browser, and this repo does not store any.
        </AlertDescription>
      </Alert>
      {account.isLoading ? <PageSkeleton /> : null}
      {account.error ? <QueryError error={account.error} /> : null}
      {account.data ? <StripeConnection key={tenant.id} account={account.data} /> : null}
      {account.isLoading ? null : (
        <>
          <section className="flex flex-col gap-3" data-region="balance" data-state={balanceView.status}>
            <h2 className="font-heading text-lg font-medium">Balance</h2>
            <BalanceBody view={balanceView} />
          </section>
          <section className="flex flex-col gap-3" data-region="payouts" data-state={payoutsView.status}>
            <h2 className="font-heading text-lg font-medium">Payouts</h2>
            <PayoutsBody view={payoutsView} />
          </section>
        </>
      )}
    </div>
  );
}
