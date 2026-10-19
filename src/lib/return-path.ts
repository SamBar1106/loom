const blocked = ["/sign-in", "/sign-up", "/forgot-password", "/v1/auth/google/start"];

export function readReturnPath(state: unknown): string {
  if (typeof state !== "object" || state === null || !("from" in state)) return "/";
  const from = state.from;
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) return "/";
  if (blocked.some((path) => from === path || from.startsWith(`${path}/`))) return "/";
  return from;
}
