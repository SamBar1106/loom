import type { ApiErrorBody, ApiErrorDetail } from "@/lib/api/types";
import { mockDispatch } from "@/lib/api/mock/dispatch";
import { mockMediaObjectUrl } from "@/lib/api/mock/media-files";
import { productImageField } from "@/lib/api/product-image";

/**
 * VITE_API_BASE is the API origin. Empty means the same origin as this app.
 * VITE_API_BASE_URL is the previous name and applies only when VITE_API_BASE is unset.
 * The in-memory mock runs only when VITE_USE_MOCK is "true" or "1".
 */
function envValue(name: string): string | undefined {
  const env = import.meta.env;
  if (!env || typeof env !== "object") return undefined;
  const value = (env as Record<string, unknown>)[name];
  return typeof value === "string" ? value : undefined;
}

function readApiBase(): string {
  const configured = envValue("VITE_API_BASE");
  if (configured !== undefined) return configured.trim().replace(/\/$/, "");
  const legacy = envValue("VITE_API_BASE_URL");
  if (legacy !== undefined) return legacy.trim().replace(/\/$/, "");
  return "";
}

function readMockFlag(): boolean {
  const value = envValue("VITE_USE_MOCK")?.trim().toLowerCase();
  return value === "true" || value === "1";
}

export const apiBaseUrl = readApiBase();
export const useMockApi = readMockFlag();

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | undefined | null;

export type ApiRequest = {
  method?: string;
  tenantId?: string | null;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

function queryString(query: ApiRequest["query"]): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
}

async function readResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | ApiErrorBody) : null;
  if (!response.ok) {
    const body = payload as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error?.code ?? "request_failed",
      body?.error?.message ?? response.statusText,
      body?.error?.details ?? [],
    );
  }
  return payload as T;
}

export async function apiRequest<T>(path: string, options: ApiRequest = {}): Promise<T> {
  const method = options.method ?? "GET";
  const params = queryString(options.query);
  const pathWithQuery = params.size > 0 ? `${path}?${params.toString()}` : path;
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.tenantId) headers.set("X-Tenant-Id", options.tenantId);

  const response = useMockApi
    ? await mockDispatch({
        method,
        path,
        query: params,
        tenantId: options.tenantId ?? null,
        body: options.body,
      })
    : await fetch(`${apiBaseUrl}${pathWithQuery}`, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        credentials: "include",
      });

  return readResponse<T>(response);
}

/** Same-origin `/media/{name}` in production. The mock serves those bytes from memory. */
export function resolveMediaUrl(url: string): string {
  const objectUrl = mockMediaObjectUrl(url);
  if (objectUrl) return objectUrl;
  if (url.startsWith("/media/") && apiBaseUrl) return `${apiBaseUrl}${url}`;
  return url;
}

export async function apiUpload<T>(path: string, options: { tenantId?: string | null; file: File }): Promise<T> {
  const form = new FormData();
  form.set(productImageField, options.file);
  const headers = new Headers({ Accept: "application/json" });
  if (options.tenantId) headers.set("X-Tenant-Id", options.tenantId);

  const response = useMockApi
    ? await mockDispatch({
        method: "POST",
        path,
        query: new URLSearchParams(),
        tenantId: options.tenantId ?? null,
        body: form,
      })
    : await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers,
        body: form,
        credentials: "include",
      });

  return readResponse<T>(response);
}
