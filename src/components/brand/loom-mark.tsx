import { cn } from "@/lib/utils";

export function LoomMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden="true">
      <rect x="3" y="3" width="3.5" height="18" rx="1" fill="currentColor" />
      <rect x="17.5" y="3" width="3.5" height="18" rx="1" fill="currentColor" />
      <path
        d="M6.5 7.5h11M6.5 12h11M6.5 16.5h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
