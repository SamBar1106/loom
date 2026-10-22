import { Link } from "react-router-dom";
import {
  CreditCardIcon,
  PackageIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  StarIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { useTenant } from "@/app/tenant-context";
import { ShopSetupCard } from "@/components/shop-setup";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Sparkline } from "@/components/sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboard } from "@/lib/api/hooks";
import type { ActivityKind, DashboardRange } from "@/lib/api/types";
import { formatPercent, formatRelative } from "@/lib/format";
import { tenantPath } from "@/lib/paths";
import { usePageTitle } from "@/pages/use-page-title";

const ranges: { value: DashboardRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  switch (kind) {
    case "order":
      return <ShoppingBagIcon />;
    case "inventory":
      return <PackageIcon />;
    case "payment":
      return <CreditCardIcon />;
    case "review":
      return <StarIcon />;
    case "automation":
      return <ZapIcon />;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function activityLabel(kind: ActivityKind): string {
  switch (kind) {
    case "order":
      return "Order";
    case "inventory":
      return "Inventory";
    case "payment":
      return "Payment";
    case "review":
      return "Review";
    case "automation":
      return "Automation";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function DashboardPage() {
  const { tenant, user } = useTenant();
  const [range, setRange] = useState<DashboardRange>("today");
  const dashboard = useDashboard(tenant.id, range);
  usePageTitle("Home");
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="flex flex-col gap-6" data-page="dashboard">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back, {firstName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={range}
            onValueChange={(value) => {
              if (value === "today" || value === "7d" || value === "30d") setRange(value);
            }}
          >
            <TabsList className="h-11">
              {ranges.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="min-h-10 px-3">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            onClick={() => void dashboard.refetch()}
            disabled={dashboard.isFetching}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        </div>
      </div>

      <ShopSetupCard />

      {dashboard.isLoading ? <PageSkeleton /> : null}
      {dashboard.error ? <QueryError error={dashboard.error} /> : null}

      {dashboard.data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{dashboard.data.store.name}</CardTitle>
              <CardDescription>{dashboard.data.store.addressLine}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Contact email</p>
                <p className="mt-1">{dashboard.data.store.contactEmail}</p>
              </div>
              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Support phone</p>
                <p className="mt-1">{dashboard.data.store.supportPhone}</p>
              </div>
              <Button
                variant="outline"
                className="sm:justify-self-start lg:justify-self-end"
                render={<Link to={tenantPath(tenant.slug, "settings")} />}
                nativeButton={false}
              >
                Manage store settings
              </Button>
            </CardContent>
          </Card>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-medium">Analytics overview</h2>
            {dashboard.data.metrics.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No metrics</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {dashboard.data.metrics.map((metric) => (
                  <Card key={metric.key}>
                    <CardHeader>
                      <CardDescription>{metric.label}</CardDescription>
                      <CardTitle className="text-2xl font-semibold">{metric.value}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between gap-3">
                      <span className={metric.deltaPercent >= 0 ? "text-sm text-positive" : "text-sm text-destructive"}>
                        {formatPercent(metric.deltaPercent)}
                      </span>
                      <Sparkline values={metric.series} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {dashboard.data.activity.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No activity</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : (
                dashboard.data.activity.map((item) => (
                  <div key={item.id} className="flex min-h-14 items-start gap-3 rounded-lg px-1 py-2">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <ActivityIcon kind={item.kind} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="outline">{activityLabel(item.kind)}</Badge>
                      <span className="text-xs text-muted-foreground">{formatRelative(item.occurredAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
