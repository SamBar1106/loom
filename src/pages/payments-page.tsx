import { useState } from "react";
import { toast } from "sonner";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePaymentsSettings, useUpdatePaymentsSettings } from "@/lib/api/hooks";
import type { PaymentsSettings } from "@/lib/api/types";
import { usePageTitle } from "@/pages/use-page-title";

function PaymentsForm({ initial }: { initial: PaymentsSettings }) {
  const { tenant } = useTenant();
  const update = useUpdatePaymentsSettings(tenant.id);
  const [draft, setDraft] = useState(initial);

  return (
        <Card>
          <CardHeader>
            <CardTitle>Payment methods</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <div>
                  <FieldLabel htmlFor="cards">Card payments</FieldLabel>
                  <FieldDescription>Record card payments in test mode.</FieldDescription>
                </div>
                <Switch
                  id="cards"
                  checked={draft.acceptCard}
                  onCheckedChange={(checked) => setDraft({ ...draft, acceptCard: checked })}
                />
              </Field>
              <Field orientation="horizontal">
                <div>
                  <FieldLabel htmlFor="manual">Manual payments</FieldLabel>
                  <FieldDescription>Mark an order paid outside a provider.</FieldDescription>
                </div>
                <Switch
                  id="manual"
                  checked={draft.acceptManual}
                  onCheckedChange={(checked) => setDraft({ ...draft, acceptManual: checked })}
                />
              </Field>
              <Field orientation="horizontal">
                <div>
                  <FieldLabel htmlFor="test-mode">Test mode</FieldLabel>
                  <FieldDescription>Sample charges are never captured.</FieldDescription>
                </div>
                <Switch
                  id="test-mode"
                  checked={draft.testMode}
                  onCheckedChange={(checked) => setDraft({ ...draft, testMode: checked })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="descriptor">Statement descriptor</FieldLabel>
                <Input
                  id="descriptor"
                  maxLength={22}
                  value={draft.statementDescriptor}
                  onChange={(event) => setDraft({ ...draft, statementDescriptor: event.target.value })}
                />
                <FieldDescription>Up to 22 characters. Shown on a sample statement.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="payout">Payout account</FieldLabel>
                <Input id="payout" readOnly value={draft.payoutAccountLabel ?? "No sample payout account"} />
                <FieldDescription>A masked label only. Account numbers are not collected here.</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button
              disabled={update.isPending}
              onClick={() =>
                update.mutate(
                  {
                    acceptCard: draft.acceptCard,
                    acceptManual: draft.acceptManual,
                    testMode: draft.testMode,
                    statementDescriptor: draft.statementDescriptor,
                  },
                  { onSuccess: () => toast.success("Payment settings saved.") },
                )
              }
            >
              Save changes
            </Button>
          </CardFooter>
        </Card>
  );
}

export function PaymentsPage() {
  const { tenant } = useTenant();
  const settings = usePaymentsSettings(tenant.id);
  usePageTitle("Accept payments");

  return (
    <div className="flex max-w-3xl flex-col gap-4" data-page="payments">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Accept payments</h1>
        <p className="text-muted-foreground">Choose how {tenant.name} records sample payments.</p>
      </div>
      <Alert>
        <AlertTitle>No secrets on this screen</AlertTitle>
        <AlertDescription>
          Provider credentials stay on the API. Loom never asks for secret keys in the browser, and this repo does not store any.
        </AlertDescription>
      </Alert>
      {settings.isLoading ? <PageSkeleton /> : null}
      {settings.error ? <QueryError error={settings.error} /> : null}
      {settings.data ? <PaymentsForm key={tenant.id} initial={settings.data} /> : null}
    </div>
  );
}
