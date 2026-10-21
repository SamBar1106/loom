import { TenantLayout } from "@/app/tenant-context";
import { PageSkeleton } from "@/components/query-state";
import { useSession } from "@/lib/api/hooks";
import { DashboardPage } from "@/pages/dashboard-page";
import { StorefrontPage } from "@/pages/storefront-pages";

export function TenantIndex() {
  const session = useSession();

  if (session.isLoading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 bg-background p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (session.data) {
    return (
      <TenantLayout>
        <DashboardPage />
      </TenantLayout>
    );
  }

  return <StorefrontPage />;
}
