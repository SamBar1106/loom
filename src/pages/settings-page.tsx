import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/api/hooks";
import type { StoreSettings } from "@/lib/api/types";
import { tenantPath } from "@/lib/paths";
import { usePageTitle } from "@/pages/use-page-title";

function SettingsForm({ initial }: { initial: StoreSettings }) {
  const { tenant } = useTenant();
  const update = useUpdateStoreSettings(tenant.id);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card>
          <CardHeader>
            <CardTitle>{draft.storeName}</CardTitle>
            <CardDescription>Status: {draft.status}. Currency {draft.currency}.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {(
                [
                  ["storeName", "Store name"],
                  ["contactEmail", "Contact email"],
                  ["supportPhone", "Support phone"],
                  ["addressLine", "Address"],
                  ["city", "City"],
                  ["region", "Region"],
                  ["postalCode", "Postal code"],
                  ["timezone", "Timezone"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} data-invalid={errors[key] ? true : undefined}>
                  <FieldLabel htmlFor={key}>{label}</FieldLabel>
                  <Input
                    id={key}
                    value={draft[key]}
                    aria-invalid={Boolean(errors[key])}
                    onChange={(event) => setField(key, event.target.value)}
                  />
                  <FieldError>{errors[key]}</FieldError>
                </Field>
              ))}
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button
              disabled={update.isPending}
              onClick={() => {
                setErrors({});
                update.mutate(draft, {
                  onSuccess: () => toast.success("Store settings saved."),
                  onError: (error) => {
                    if (error instanceof ApiError) {
                      const next: Record<string, string> = {};
                      for (const detail of error.details) {
                        if (detail.field) next[detail.field] = detail.message;
                      }
                      setErrors(next);
                    }
                    toast.error(error instanceof ApiError ? error.message : "Could not save settings.");
                  },
                });
              }}
            >
              Save changes
            </Button>
            <Button variant="outline" render={<Link to={tenantPath(tenant.slug, "settings/payments")} />} nativeButton={false}>
              Accept payments
            </Button>
          </CardFooter>
        </Card>
  );
}

export function SettingsPage() {
  const { tenant } = useTenant();
  const settings = useStoreSettings(tenant.id);
  usePageTitle("Store settings");

  return (
    <div className="flex max-w-3xl flex-col gap-4" data-page="settings">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Store settings</h1>
        <p className="text-muted-foreground">Contact details</p>
      </div>
      {settings.isLoading ? <PageSkeleton /> : null}
      {settings.error ? <QueryError error={settings.error} /> : null}
      {settings.data ? <SettingsForm key={tenant.id} initial={settings.data} /> : null}
      {!settings.isLoading && !settings.error && !settings.data ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No store settings</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : null}
    </div>
  );
}
