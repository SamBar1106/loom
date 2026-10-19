import { sampleAccount } from "@/lib/api/sample-account";
import type { ApiErrorDetail } from "@/lib/api/types";
import { readPreviewFlags } from "@/lib/preview-flags";

type AuthRequest = {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
};

const STORAGE_KEY = "loom.mock.session";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Account = {
  name: string;
  password: string;
};

type Identity = {
  email: string;
  name: string;
};

const accounts = new Map<string, Account>();

function seedAccounts(): void {
  accounts.clear();
  accounts.set(sampleAccount.email, {
    name: sampleAccount.name,
    password: sampleAccount.password,
  });
}

seedAccounts();

function error(status: number, code: string, message: string, details?: ApiErrorDetail[]): Response {
  return Response.json({ error: { code, message, details } }, { status });
}

function invalid(details: ApiErrorDetail[], status: 400 | 422 = 400): Response {
  return error(status, "validation_error", "Check the highlighted fields.", details);
}

function tooMany(): Response {
  return error(429, "rate_limited", "Too many requests.");
}

function inviteOnly(): Response {
  return error(403, "forbidden", "Sign-up is disabled.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
  return `${first}${second}`.toUpperCase() || "S";
}

function userId(email: string): string {
  if (email === sampleAccount.email) return "usr_sample_alex";
  const local = email.split("@")[0]?.replace(/[^a-z0-9]+/g, "") || "sample";
  return `usr_${local}`;
}

function readIdentity(): Identity | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Identity>;
    if (typeof parsed.email === "string" && typeof parsed.name === "string") {
      return { email: parsed.email, name: parsed.name };
    }
  } catch {
    return null;
  }
  return null;
}

function writeIdentity(identity: Identity | null): void {
  if (typeof sessionStorage === "undefined") return;
  if (!identity) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: identity.email, name: identity.name }));
}

function sessionBody(identity: Identity, tenantIds: string[]) {
  return {
    user: {
      id: userId(identity.email),
      name: identity.name,
      email: identity.email,
      avatarInitials: initials(identity.name),
      tenantIds,
    },
    expiresAt: "2026-10-19T23:00:00.000Z",
  };
}

function signInResponse(identity: Identity, tenantIds: string[], status = 200): Response {
  writeIdentity(identity);
  return Response.json(sessionBody(identity, tenantIds), { status });
}

function incorrect(): Response {
  return error(401, "unauthenticated", "Incorrect email or password.");
}

function handleSession(request: AuthRequest, tenantIds: string[]): Response {
  if (request.method === "GET") {
    const identity = readIdentity();
    if (!identity) return error(401, "unauthenticated", "Sign in to continue.");
    return Response.json(sessionBody(identity, tenantIds));
  }

  if (request.method === "POST") {
    if (readPreviewFlags().rateLimit) return tooMany();
    const body = isRecord(request.body) ? request.body : {};
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const details: ApiErrorDetail[] = [];
    if (!email) details.push({ field: "email", message: "Enter an email address." });
    if (!password) details.push({ field: "password", message: "Enter your password." });
    if (details.length > 0) return invalid(details);
    const account = accounts.get(email);
    if (!account || account.password !== password) return incorrect();
    return signInResponse({ email, name: account.name }, tenantIds);
  }

  if (request.method === "DELETE") {
    writeIdentity(null);
    return new Response(null, { status: 204 });
  }

  return error(404, "not_found", "That API path is not in the Loom contract.");
}

function handleRegister(request: AuthRequest): Response {
  if (request.method !== "POST") {
    return error(404, "not_found", "That API path is not in the Loom contract.");
  }
  const flags = readPreviewFlags();
  if (flags.rateLimit) return tooMany();
  if (!flags.registerOpen) return inviteOnly();
  const body = isRecord(request.body) ? request.body : {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const details: ApiErrorDetail[] = [];
  if (!name || name.length > 120) {
    details.push({ field: "name", message: "Enter your full name." });
  }
  if (!EMAIL.test(email)) {
    details.push({ field: "email", message: "Enter an email address." });
  }
  if (password.length < MIN_PASSWORD) {
    details.push({ field: "password", message: "Use at least 8 characters." });
  }
  if (details.length > 0) return invalid(details, 422);
  if (accounts.has(email)) {
    return error(409, "conflict", "An account with that email already exists.", [
      { field: "email", message: "An account with that email already exists." },
    ]);
  }
  accounts.set(email, { name, password });
  // sessionStorage stands in for the HttpOnly loom_session cookie a live 201 sets.
  writeIdentity({ email, name });
  return Response.json(
    { user: { id: userId(email), name, email } },
    { status: 201 },
  );
}

function handleGoogle(request: AuthRequest, tenantIds: string[]): Response {
  if (request.method !== "GET") {
    return error(404, "not_found", "That API path is not in the Loom contract.");
  }
  if (request.path === "/v1/auth/google/start") {
    return new Response(null, {
      status: 302,
      headers: { Location: "/v1/auth/google/callback?code=sample&state=sample" },
    });
  }
  const code = request.query.get("code");
  if (code !== "sample") return incorrect();
  const account = accounts.get(sampleAccount.email);
  if (!account) return incorrect();
  return signInResponse({ email: sampleAccount.email, name: account.name }, tenantIds);
}

export function hasMockSession(): boolean {
  return readIdentity() !== null;
}

export function resetAuthMock(): void {
  seedAccounts();
  writeIdentity(null);
}

export function handleAuth(request: AuthRequest, tenantIds: string[]): Response | null {
  if (request.path === "/v1/auth/session") return handleSession(request, tenantIds);
  if (request.path === "/v1/auth/register") return handleRegister(request);
  if (request.path === "/v1/auth/google/start" || request.path === "/v1/auth/google/callback") {
    return handleGoogle(request, tenantIds);
  }
  return null;
}
