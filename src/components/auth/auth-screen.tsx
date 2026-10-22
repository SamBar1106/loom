import type { ReactNode } from "react";
import { PreviewToggles } from "@/components/auth/preview-toggles";
import { SiteFooter } from "@/components/layout/site-footer";
import { usePageTitle } from "@/pages/use-page-title";

export function AuthScreen({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  usePageTitle(title);

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <main className="flex flex-1 px-4 py-6 sm:px-6">
        <div className="m-auto flex w-full max-w-md flex-col gap-4">
          <div className="rounded-xl border bg-card p-8 text-card-foreground shadow-sm sm:p-10">
            <p className="font-heading text-2xl font-semibold tracking-tight">Loom</p>
            <h1 className="mt-6 font-heading text-xl font-semibold tracking-tight">{title}</h1>
            <div className="mt-6 flex flex-col gap-4">{children}</div>
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          </div>
          <PreviewToggles />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative flex items-center py-1">
      <div className="h-px w-full bg-border" />
      <span className="absolute left-1/2 -translate-x-1/2 bg-card px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        or
      </span>
    </div>
  );
}

export const authLinkClassName = "font-medium text-foreground hover:underline";
