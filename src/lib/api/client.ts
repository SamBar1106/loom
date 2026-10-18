import type { ApiErrorBody, ApiErrorDetail } from "@/lib/api/types";
import { mockDispatch } from "@/lib/api/mock/dispatch";

/**
 * Live requests go to VITE_API_BASE_URL.
 * When that variable is unset, the same paths are handled by the in-memory mock.
 */
const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
export const apiBaseUrl = configuredBase.replace(/\/$/, "");
export const useMockApi = apiBaseUrl.length === 0;

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
