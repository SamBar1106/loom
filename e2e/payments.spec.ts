import { expect, test } from "@playwright/test";
import {
  disconnectedStripeAccount,
  isHttpUrl,
  loadStripeAccount,
  loadStripeBalance,
  loadStripePayouts,
  startStripeOnboarding,
  stripeBalanceView,
  stripeConnectAction,
  stripeConnectLabel,
  stripePayoutListQuery,
  stripePayoutStatusLabel,
  stripePayoutsView,
  type StripeRequest,
  type StripeRequester,
} from "../src/lib/stripe-connect";
import type { StripePayoutStatus } from "../src/lib/api/types";
import { signIn } from "./sign-in";

const returnUrl = "https://loom.example/t/daykodee/settings/payments";

test("stripe connect follows account status and refuses unsafe links", async () => {
  expect(
    stripeConnectAction({ id: null, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false }),
  ).toBe("connect");
  expect(stripeConnectLabel("connect")).toBe("Connect with Stripe");
  expect(
    stripeConnectAction({ id: "acct_1", chargesEnabled: false, payoutsEnabled: true, detailsSubmitted: true }),
  ).toBe("continue");
  expect(stripeConnectLabel("continue")).toBe("Continue onboarding");
  expect(
    stripeConnectAction({ id: "acct_1", chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true }),
  ).toBe("ready");
  expect(stripeConnectLabel("ready")).toBeNull();

  expect(isHttpUrl("https://connect.stripe.com/setup/s/acct_1")).toBe(true);
  expect(isHttpUrl("http://127.0.0.1:4173/t/daykodee/settings/payments")).toBe(true);
  expect(isHttpUrl("javascript:alert(1)")).toBe(false);
  expect(isHttpUrl("https://user:secret@connect.stripe.com/setup")).toBe(false);

  await expect(
    loadStripeAccount("ten_daykodee", async () => {
      throw { status: 404, code: "not_found" };
    }),
  ).resolves.toEqual(disconnectedStripeAccount());

  const missingTenant = { status: 404, code: "tenant_not_found" };
  await expect(
    loadStripeAccount("ten_missing", async () => {
      throw missingTenant;
    }),
  ).rejects.toBe(missingTenant);

  const seen: { path: string; options: StripeRequest }[] = [];
  const request: StripeRequester = async (path, options) => {
    seen.push({ path, options });
    if (path === "/v1/stripe/accounts") {
      return { id: "acct_new", chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false };
    }
    return { url: "https://connect.stripe.com/setup/s/acct_new" };
  };
  const created = await startStripeOnboarding({
    tenantId: "ten_daykodee",
    accountId: null,
    returnUrl,
    refreshUrl: returnUrl,
    request,
  });
  expect(created).toBe("https://connect.stripe.com/setup/s/acct_new");
  expect(seen.map((call) => `${call.options.method ?? "GET"} ${call.path}`)).toEqual([
    "POST /v1/stripe/accounts",
    "POST /v1/stripe/onboarding-links",
  ]);
  expect(seen.every((call) => call.options.tenantId === "ten_daykodee")).toBe(true);
  expect(seen[1]?.options.body).toEqual({ returnUrl, refreshUrl: returnUrl });
  expect(JSON.stringify(seen)).not.toMatch(/sk_live|sk_test|secret|password|apiKey/i);

  const continued: string[] = [];
  const existing = await startStripeOnboarding({
    tenantId: "ten_harbor",
    accountId: "acct_sample_ten_harbor",
    returnUrl,
    refreshUrl: returnUrl,
    request: async (path) => {
      continued.push(path);
      return { url: "https://connect.stripe.com/setup/s/acct_sample_ten_harbor" };
    },
  });
  expect(continued).toEqual(["/v1/stripe/onboarding-links"]);
  expect(existing).toBe("https://connect.stripe.com/setup/s/acct_sample_ten_harbor");

  await expect(
    startStripeOnboarding({
      tenantId: "ten_harbor",
      accountId: "acct_sample_ten_harbor",
      returnUrl,
      refreshUrl: returnUrl,
      request: async () => ({ url: "javascript:alert(1)" }),
    }),
  ).rejects.toThrow("Stripe returned an onboarding link this page will not open.");
});

test("stripe balance and payouts use tenant auth and treat a missing account as empty", async () => {
  const missing = { status: 404, code: "not_found" };
  await expect(
    loadStripeBalance("ten_daykodee", async () => {
      throw missing;
    }),
  ).resolves.toBeNull();
  await expect(
    loadStripePayouts("ten_daykodee", async () => {
      throw missing;
    }),
  ).resolves.toBeNull();

  const unknownTenant = { status: 404, code: "tenant_not_found" };
  await expect(
    loadStripeBalance("ten_missing", async () => {
      throw unknownTenant;
    }),
  ).rejects.toBe(unknownTenant);

  const seen: { path: string; options: StripeRequest }[] = [];
  const request: StripeRequester = async (path, options) => {
    seen.push({ path, options });
    if (path === "/v1/stripe/balance") {
      return {
        available: [{ amount: "186.40", currency: "USD" }],
        pending: [{ amount: "24.00", currency: "USD" }],
      };
    }
    return {
      data: [
        {
          id: "po_sample_h1",
          amount: "120.00",
          currency: "USD",
          status: "paid",
          arrivalDate: "2026-10-16T23:00:00.000Z",
          createdAt: "2026-10-15T23:00:00.000Z",
        },
      ],
      page: { page: 1, pageSize: 8, total: 1, totalPages: 1 },
    };
  };
  const balance = await loadStripeBalance("ten_harbor", request);
  const payouts = await loadStripePayouts("ten_harbor", request);
  expect(balance?.available[0]?.amount).toBe("186.40");
  expect(balance?.pending[0]?.amount).toBe("24.00");
  expect(payouts?.data[0]?.id).toBe("po_sample_h1");
  expect(seen.map((call) => call.path)).toEqual(["/v1/stripe/balance", "/v1/stripe/payouts"]);
  expect(seen.every((call) => call.options.tenantId === "ten_harbor")).toBe(true);
  expect(seen[1]?.options.query).toEqual(stripePayoutListQuery);
  expect(JSON.stringify(seen)).not.toMatch(/sk_live|sk_test|secret|password|apiKey/i);

  expect(stripeBalanceView({ isLoading: true, error: null, data: undefined }).status).toBe("loading");
  expect(stripeBalanceView({ isLoading: false, error: new Error("upstream"), data: undefined }).status).toBe("error");
  expect(stripeBalanceView({ isLoading: false, error: null, data: null }).status).toBe("empty");
  expect(
    stripeBalanceView({ isLoading: false, error: null, data: { available: [], pending: [] } }).status,
  ).toBe("empty");
  expect(stripeBalanceView({ isLoading: false, error: null, data: balance }).status).toBe("ready");

  expect(stripePayoutsView({ isLoading: true, error: null, data: undefined }).status).toBe("loading");
  expect(stripePayoutsView({ isLoading: false, error: new Error("upstream"), data: undefined }).status).toBe("error");
  expect(stripePayoutsView({ isLoading: false, error: null, data: null }).status).toBe("empty");
  expect(
    stripePayoutsView({
      isLoading: false,
      error: null,
      data: { data: [], page: { page: 1, pageSize: 8, total: 0, totalPages: 0 } },
    }).status,
  ).toBe("empty");
  expect(stripePayoutsView({ isLoading: false, error: null, data: payouts }).status).toBe("ready");

  const statuses: StripePayoutStatus[] = ["paid", "pending", "in_transit", "canceled", "failed"];
  expect(statuses.map(stripePayoutStatusLabel)).toEqual(["Paid", "Pending", "In transit", "Canceled", "Failed"]);
});

test("accept payments shows stripe status without collecting secrets", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/daykodee/settings/payments");
  const payments = page.locator("[data-page=payments]");
  await expect(page.getByRole("heading", { name: "Accept payments" })).toBeVisible();
  await expect(page.getByText("Could not load this page")).toHaveCount(0);
  await expect(page.getByText("That API path is not in the Loom contract.")).toHaveCount(0);
  await expect(payments.locator("input, textarea")).toHaveCount(0);
  await expect(payments.getByText(/sk_live|sk_test/)).toHaveCount(0);
  await expect(page.getByText("No secrets on this screen")).toBeVisible();
  await expect(page.getByText("No Stripe account connected.")).toBeVisible();
  await expect(page.locator("[data-status=charges]")).toContainText("Not enabled");
  await expect(page.locator("[data-status=payouts]")).toContainText("Not enabled");
  await expect(page.locator("[data-status=details]")).toContainText("Not submitted");
  const connect = page.getByRole("button", { name: "Connect with Stripe" });
  await expect(connect).toBeVisible();
  expect(await connect.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  await page.goto("/t/harbor-sample/settings/payments");
  await expect(page.getByText("acct_sample_ten_harbor")).toBeVisible();
  await expect(page.locator("[data-status=charges]")).toContainText("Not enabled");
  await expect(page.locator("[data-status=payouts]")).toContainText("Not enabled");
  await expect(page.locator("[data-status=details]")).toContainText("Submitted");
  await expect(page.getByRole("button", { name: "Continue onboarding" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect with Stripe" })).toHaveCount(0);
});

test("connect with stripe creates an account and opens onboarding", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/daykodee/settings/payments");
  await page.route("https://connect.stripe.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Stripe</title><h1>Stripe sample onboarding</h1>",
    }),
  );
  await page.getByRole("button", { name: "Connect with Stripe" }).click();
  await expect(page).toHaveURL(/https:\/\/connect\.stripe\.com\/setup\/s\/acct_sample_ten_daykodee/);
  const landed = new URL(page.url());
  expect(landed.searchParams.get("creates")).toBe("1");
  expect(landed.searchParams.get("return")).toBe("http://127.0.0.1:4173/t/daykodee/settings/payments");
  expect(landed.username).toBe("");
  expect(landed.password).toBe("");
  await expect(page.getByRole("heading", { name: "Stripe sample onboarding" })).toBeVisible();
});

test("continue onboarding does not create a second account", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/harbor-sample/settings/payments");
  await page.route("https://connect.stripe.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Stripe</title><h1>Stripe sample onboarding</h1>",
    }),
  );
  await page.getByRole("button", { name: "Continue onboarding" }).click();
  await expect(page).toHaveURL(/https:\/\/connect\.stripe\.com\/setup\/s\/acct_sample_ten_harbor/);
  const landed = new URL(page.url());
  expect(landed.searchParams.get("creates")).toBe("0");
  expect(landed.searchParams.get("return")).toBe("http://127.0.0.1:4173/t/harbor-sample/settings/payments");
});

test("payments page shows an empty balance and payouts without a connected account", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/daykodee/settings/payments");
  const payments = page.locator("[data-page=payments]");
  const balance = payments.locator("[data-region=balance]");
  const payouts = payments.locator("[data-region=payouts]");
  await expect(balance).toHaveAttribute("data-state", "empty");
  await expect(balance.getByRole("heading", { name: "Balance" })).toBeVisible();
  await expect(balance.getByText("No balance")).toBeVisible();
  await expect(payouts).toHaveAttribute("data-state", "empty");
  await expect(payouts.getByRole("heading", { name: "Payouts" })).toBeVisible();
  await expect(payouts.getByText("No payouts")).toBeVisible();
  await expect(payments.getByText("Could not load this page")).toHaveCount(0);
  await expect(payments.getByText("$186.40")).toHaveCount(0);
  await expect(payments.getByText("po_sample_h1")).toHaveCount(0);
  await expect(payments.locator("input, textarea")).toHaveCount(0);
  await expect(payments.getByText(/sk_live|sk_test/)).toHaveCount(0);
});

test("payments page shows available and pending balance and recent payouts", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/harbor-sample/settings/payments");
  const payments = page.locator("[data-page=payments]");
  const balance = payments.locator("[data-region=balance]");
  const payouts = payments.locator("[data-region=payouts]");
  await expect(balance).toHaveAttribute("data-state", "ready");
  await expect(balance.getByText("Available")).toBeVisible();
  await expect(balance.getByText("Pending")).toBeVisible();
  await expect(balance.locator("[data-field=available]")).toHaveText("$186.40");
  await expect(balance.locator("[data-field=pending]")).toHaveText("$24.00");
  await expect(payouts).toHaveAttribute("data-state", "ready");
  await expect(payouts.getByRole("columnheader", { name: "Payout" })).toBeVisible();
  await expect(payouts.getByRole("columnheader", { name: "Amount" })).toBeVisible();
  await expect(payouts.getByRole("columnheader", { name: "Status" })).toBeVisible();
  await expect(payouts.getByRole("columnheader", { name: "Arrival" })).toBeVisible();
  await expect(payouts.getByRole("columnheader", { name: "Created" })).toBeVisible();
  const paid = payouts.locator("[data-payout=po_sample_h1]");
  const transit = payouts.locator("[data-payout=po_sample_h2]");
  await expect(paid).toContainText("po_sample_h1");
  await expect(paid).toContainText("$120.00");
  await expect(paid).toContainText("Paid");
  await expect(transit).toContainText("$40.00");
  await expect(transit).toContainText("In transit");
  await expect(payments.getByText("No balance")).toHaveCount(0);
  await expect(payments.getByText("No payouts")).toHaveCount(0);
  await expect(payments.getByText("Could not load this page")).toHaveCount(0);
  await expect(payments.locator("input, textarea")).toHaveCount(0);
  await expect(payments.getByText(/sk_live|sk_test/)).toHaveCount(0);
  await expect(page.getByText("acct_sample_ten_harbor")).toBeVisible();
});
