import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/api/hooks";

export function RequireAuth() {
  const session = useSession();
  const location = useLocation();

  if (session.isLoading) {
    return (
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 bg-background p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (session.error instanceof ApiError && session.error.status === 401) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  if (session.error || !session.data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <QueryError error={session.error} />
      </div>
    );
  }

  return <Outlet />;
}
