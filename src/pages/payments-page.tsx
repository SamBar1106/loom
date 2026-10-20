import { toast } from "sonner";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useStartStripeOnboarding, useStripeAccount } from "@/lib/api/hooks";
import type { StripeAccount } from "@/lib/api/types";
import { tenantPath } from "@/lib/paths";
import { stripeConnectAction, stripeConnectLabel } from "@/lib/stripe-connect";
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
  const returnUrl = `${window.location.origin}${tenantPath(tenant.slug, "settings/payments")}`;

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

export function PaymentsPage() {
  const { tenant } = useTenant();
  const account = useStripeAccount(tenant.id);
  usePageTitle("Accept payments");

  return (
    <div className="flex max-w-3xl flex-col gap-4" data-page="payments">
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
    </div>
  );
}
