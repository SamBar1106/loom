import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useMockApi } from "@/lib/api/client";
import { readPreviewFlags, writePreviewFlags, type PreviewFlags } from "@/lib/preview-flags";

export function PreviewToggles() {
  const [flags, setFlags] = useState<PreviewFlags>(readPreviewFlags);
  if (!useMockApi) return null;

  function update(next: PreviewFlags) {
    writePreviewFlags(next);
    setFlags(next);
  }

  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-sm text-card-foreground">
      <p className="text-xs font-medium text-muted-foreground">Preview</p>
      <label htmlFor="preview-invite-only" className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
        Invite-only
        <Switch
          id="preview-invite-only"
          checked={!flags.registerOpen}
          onCheckedChange={(checked) => update({ ...flags, registerOpen: !checked })}
        />
      </label>
      <label htmlFor="preview-rate-limit" className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
        Rate limit
        <Switch
          id="preview-rate-limit"
          checked={flags.rateLimit}
          onCheckedChange={(checked) => update({ ...flags, rateLimit: checked })}
        />
      </label>
    </div>
  );
}
