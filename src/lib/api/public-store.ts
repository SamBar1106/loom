import { apiRequest, type ApiRequest } from "@/lib/api/client";
import type { PublicCheckoutRequest, PublicCheckoutResult } from "@/lib/api/types";

/**
 * Buyer checkout. loom-api implements this path.
 * Keep the path in this module so the frontend and API stay aligned.
 */
export const publicCheckoutPath = "/v1/public/checkout";

export type PublicRequester = <T>(path: string, options: ApiRequest) => Promise<T>;

export function publicProductsPath(storeSlug: string): string {
  return `/v1/public/stores/${encodeURIComponent(storeSlug)}/products`;
}

export function publicProductPath(storeSlug: string, productId: string): string {
  return `${publicProductsPath(storeSlug)}/${encodeURIComponent(productId)}`;
}

export function startPublicCheckout(
  body: PublicCheckoutRequest,
  request: PublicRequester = apiRequest,
): Promise<PublicCheckoutResult> {
  return request<PublicCheckoutResult>(publicCheckoutPath, { method: "POST", body });
}
