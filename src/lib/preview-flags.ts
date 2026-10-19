const STORAGE_KEY = "loom.mock.flags";

export type PreviewFlags = {
  registerOpen: boolean;
  rateLimit: boolean;
};

const closedFlags: PreviewFlags = {
  registerOpen: false,
  rateLimit: false,
};

export function readPreviewFlags(): PreviewFlags {
  if (typeof sessionStorage === "undefined") return closedFlags;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return closedFlags;
  try {
    const parsed = JSON.parse(raw) as Partial<PreviewFlags>;
    return {
      registerOpen: parsed.registerOpen === true,
      rateLimit: parsed.rateLimit === true,
    };
  } catch {
    return closedFlags;
  }
}

export function writePreviewFlags(flags: PreviewFlags): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}
