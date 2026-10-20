import type { StripeAccount, StripeOnboardingLink } from "./api/types";

export type StripeConnectAction = "connect" | "continue" | "ready";

export type StripeRequest = {
  method?: string;
  tenantId?: string | null;
  body?: unknown;
};

export type StripeRequester = <T>(path: string, options: StripeRequest) => Promise<T>;

export function disconnectedStripeAccount(): StripeAccount {
  return {
    id: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
  };
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

export function stripeConnectAction(account: StripeAccount): StripeConnectAction {
  if (!account.id) return "connect";
  if (account.chargesEnabled && account.payoutsEnabled && account.detailsSubmitted) return "ready";
  return "continue";
}

export function stripeConnectLabel(action: StripeConnectAction): "Connect with Stripe" | "Continue onboarding" | null {
  switch (action) {
    case "connect":
      return "Connect with Stripe";
    case "continue":
      return "Continue onboarding";
    case "ready":
      return null;
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

function isMissingStripeAccount(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const value = error as { status?: unknown; code?: unknown };
  return value.status === 404 && value.code === "not_found";
}

export async function loadStripeAccount(tenantId: string, request: StripeRequester): Promise<StripeAccount> {
  try {
    return await request<StripeAccount>("/v1/stripe/account", { tenantId });
  } catch (error) {
    if (isMissingStripeAccount(error)) return disconnectedStripeAccount();
    throw error;
  }
}

export async function startStripeOnboarding(input: {
  tenantId: string;
  accountId: string | null;
  returnUrl: string;
  refreshUrl: string;
  request: StripeRequester;
}): Promise<string> {
  if (!input.accountId) {
    await input.request<StripeAccount>("/v1/stripe/accounts", {
      method: "POST",
      tenantId: input.tenantId,
    });
  }
  const link = await input.request<StripeOnboardingLink>("/v1/stripe/onboarding-links", {
    method: "POST",
    tenantId: input.tenantId,
    body: {
      returnUrl: input.returnUrl,
      refreshUrl: input.refreshUrl,
    },
  });
  if (typeof link?.url !== "string" || !isHttpUrl(link.url)) {
    throw new Error("Stripe returned an onboarding link this page will not open.");
  }
  return link.url;
}
