import { useState } from "react";
import { Link } from "react-router-dom";
import { useTenant } from "@/app/tenant-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useShopSetup } from "@/lib/api/hooks";
import { dismissShopSetup, isShopSetupDismissed, type ShopSetupId, type ShopSetupStep } from "@/lib/onboarding";
import { tenantPath } from "@/lib/paths";

function stepHref(id: ShopSetupId, slug: string, done: boolean): string {
  switch (id) {
    case "name":
      return tenantPath(slug, "settings");
    case "product":
      return tenantPath(slug, done ? "products" : "products/new");
    case "stripe":
      return tenantPath(slug, "settings/payments");
    case "link":
      return `${tenantPath(slug)}?view=shop`;
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

function readDismissed(tenantId: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return isShopSetupDismissed(tenantId, localStorage);
}

function ShopSetupList({ steps, slug }: { steps: ShopSetupStep[]; slug: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {steps.map((step) => (
        <li
          key={step.id}
          data-step={step.id}
          data-complete={step.done ? "true" : "false"}
          className="flex items-center gap-3"
        >
          <Checkbox
            checked={step.done}
            disabled
            aria-label={step.done ? `${step.label} done` : `${step.label} not done`}
          />
          <Link to={stepHref(step.id, slug, step.done)} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center">
            <span className="font-medium">{step.label}</span>
            {step.id === "link" ? (
              <span className="truncate text-sm text-muted-foreground">{tenantPath(slug)}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ShopSetupBody() {
  const { tenant } = useTenant();
  const shop = useShopSetup(tenant.id, tenant.slug);
  const [dismissed, setDismissed] = useState(() => readDismissed(tenant.id));
  const progress = shop.progress;
  const steps = shop.steps;

  if (!steps || !progress || shop.error) return null;
  if (dismissed || progress.completed === progress.total) return null;

  return (
    <Card data-section="shop-setup">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Setup</CardTitle>
            <CardDescription>
              {progress.completed} of {progress.total}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              dismissShopSetup(tenant.id, localStorage);
              setDismissed(true);
            }}
          >
            Dismiss
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={(progress.completed / progress.total) * 100} aria-label="Shop setup" />
        <ShopSetupList steps={steps} slug={tenant.slug} />
      </CardContent>
    </Card>
  );
}

export function ShopSetupCard() {
  const { tenant } = useTenant();
  return <ShopSetupBody key={tenant.id} />;
}
