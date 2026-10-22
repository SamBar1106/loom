import type {
  Page,
  StripeAccount,
  StripeBalance,
  StripeOnboardingLink,
  StripePayout,
  StripePayoutStatus,
} from "./api/types";

export type StripeConnectAction = "connect" | "continue" | "ready";

export type StripeQueryValue = string | number | boolean | undefined | null;

export type StripeRequest = {
  method?: string;
  tenantId?: string | null;
  body?: unknown;
  query?: Record<string, StripeQueryValue>;
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

export const stripePayoutListQuery = { page: 1, pageSize: 8 } as const;

export type StripeAsyncView<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "empty" }
  | { status: "ready"; value: T };

export async function loadStripeBalance(tenantId: string, request: StripeRequester): Promise<StripeBalance | null> {
  try {
    return await request<StripeBalance>("/v1/stripe/balance", { tenantId });
  } catch (error) {
    if (isMissingStripeAccount(error)) return null;
    throw error;
  }
}

export async function loadStripePayouts(
  tenantId: string,
  request: StripeRequester,
): Promise<Page<StripePayout> | null> {
  try {
    return await request<Page<StripePayout>>("/v1/stripe/payouts", {
      tenantId,
      query: { page: stripePayoutListQuery.page, pageSize: stripePayoutListQuery.pageSize },
    });
  } catch (error) {
    if (isMissingStripeAccount(error)) return null;
    throw error;
  }
}

export function stripeBalanceView(input: {
  isLoading: boolean;
  error: unknown;
  data: StripeBalance | null | undefined;
}): StripeAsyncView<StripeBalance> {
  if (input.isLoading) return { status: "loading" };
  if (input.error) return { status: "error", error: input.error };
  if (!input.data || (input.data.available.length === 0 && input.data.pending.length === 0)) {
    return { status: "empty" };
  }
  return { status: "ready", value: input.data };
}

export function stripePayoutsView(input: {
  isLoading: boolean;
  error: unknown;
  data: Page<StripePayout> | null | undefined;
}): StripeAsyncView<StripePayout[]> {
  if (input.isLoading) return { status: "loading" };
  if (input.error) return { status: "error", error: input.error };
  if (!input.data || input.data.data.length === 0) return { status: "empty" };
  return { status: "ready", value: input.data.data };
}

export function stripePayoutStatusLabel(status: StripePayoutStatus): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "in_transit":
      return "In transit";
    case "canceled":
      return "Canceled";
    case "failed":
      return "Failed";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function stripePayoutStatusVariant(
  status: StripePayoutStatus,
): "positive" | "warning" | "secondary" | "destructive" {
  switch (status) {
    case "paid":
      return "positive";
    case "pending":
      return "warning";
    case "in_transit":
      return "secondary";
    case "canceled":
      return "secondary";
    case "failed":
      return "destructive";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}
