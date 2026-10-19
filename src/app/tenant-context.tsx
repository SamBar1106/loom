import { createContext, useContext, useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useSession, useTenants } from "@/lib/api/hooks";
import type { SessionUser, Tenant } from "@/lib/api/types";

export type TenantState = {
  tenant: Tenant;
  tenants: Tenant[];
  user: SessionUser;
};

const TenantContext = createContext<TenantState | null>(null);

export function useTenant(): TenantState {
  const value = useContext(TenantContext);
  if (!value) {
    throw new Error("useTenant must be used inside a tenant route.");
  }
  return value;
}

export function TenantLayout() {
  const { tenantSlug } = useParams();
  const session = useSession();
  const tenantsQuery = useTenants();

  const tenant = tenantsQuery.data?.data.find((item) => item.slug === tenantSlug);

  useEffect(() => {
    if (!tenant) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", tenant.accent);
    root.style.setProperty("--primary-foreground", tenant.accentForeground);
    root.style.setProperty("--sidebar-primary", tenant.accent);
    root.style.setProperty("--sidebar-primary-foreground", tenant.accentForeground);
    root.style.setProperty("--ring", tenant.accent);
    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-primary-foreground");
      root.style.removeProperty("--ring");
    };
  }, [tenant]);

  if (!tenantSlug) return <Navigate to="/t/daykodee" replace />;

  if (session.isLoading || tenantsQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (session.error || tenantsQuery.error || !session.data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <QueryError error={session.error ?? tenantsQuery.error} />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="mx-auto flex min-h-svh max-w-lg items-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Tenant not found</EmptyTitle>
            <EmptyDescription>That workspace is not in the sample tenant list.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const state: TenantState = {
    tenant,
    tenants: tenantsQuery.data?.data ?? [],
    user: session.data.user,
  };

  return (
    <TenantContext.Provider value={state}>
      <AppShell>
        <Outlet />
      </AppShell>
    </TenantContext.Provider>
  );
}
