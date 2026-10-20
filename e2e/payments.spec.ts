import { expect, test } from "@playwright/test";
import {
  disconnectedStripeAccount,
  isHttpUrl,
  loadStripeAccount,
  startStripeOnboarding,
  stripeConnectAction,
  stripeConnectLabel,
  type StripeRequest,
  type StripeRequester,
} from "../src/lib/stripe-connect";
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
