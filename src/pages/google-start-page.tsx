import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AuthScreen, authLinkClassName } from "@/components/auth/auth-screen";
import { apiRequest, useMockApi } from "@/lib/api/client";
import { sampleAccount } from "@/lib/api/sample-account";
import type { Session } from "@/lib/api/types";

/**
 * Preview-only landing for `/v1/auth/google/start` when no API origin is set.
 * A live API receives this navigation on its own origin and redirects to Google.
 */
export function GoogleStartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!useMockApi) return;
    let cancelled = false;
    apiRequest<Session>("/v1/auth/session", {
      method: "POST",
      body: { email: sampleAccount.email, password: sampleAccount.password },
    })
      .then((session) => {
        if (cancelled) return;
        queryClient.setQueryData(["session"], session);
        navigate("/", { replace: true });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, queryClient]);

  if (useMockApi && !failed) {
    return <main className="min-h-svh bg-background" />;
  }

  return (
    <AuthScreen
      title="Google sign-in"
      footer={
        <Link to="/sign-in" className={authLinkClassName}>
          Back to sign in
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">
        Continue with Google opens the API at /v1/auth/google/start.
      </p>
    </AuthScreen>
  );
}
