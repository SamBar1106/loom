import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const legalLinkClassName = "font-medium text-foreground underline-offset-4 hover:underline";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-auto border-t", className)}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Orion Multiservices LLC · Clearwater, Florida</p>
        <nav aria-label="Legal" className="flex gap-4">
          <Link className="underline-offset-4 hover:text-foreground hover:underline" to="/terms">
            Terms of Service
          </Link>
          <Link className="underline-offset-4 hover:text-foreground hover:underline" to="/privacy">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
