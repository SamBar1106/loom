import { expect, test } from "@playwright/test";

test("signed-out buyers see the store, a product, and checkout", async ({ page }) => {
  await page.route("https://checkout.stripe.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Checkout</title><h1>Checkout</h1>",
    });
  });

  await page.goto("/t/daykodee");
  await expect(page).toHaveURL(/\/t\/daykodee$/);
  await expect(page.locator("[data-page=storefront]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Daykodee Sample Shop" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sample Tote Bag" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sample Harbor Lantern" })).toHaveCount(0);

  await page.goto("/t/harbor-sample");
  await expect(page.getByRole("heading", { name: "Harbor Sample Goods" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sample Harbor Lantern" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sample Tote Bag" })).toHaveCount(0);

  await page.goto("/t/missing-store");
  await expect(page.getByRole("heading", { name: "Store not found" })).toBeVisible();

  await page.goto("/t/daykodee/orders");
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/t/daykodee/p/prd_sample_tote");
  await expect(page.locator("[data-page=store-product]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sample Tote Bag" })).toBeVisible();
  await expect(page.getByText("$32.00")).toBeVisible();
  await page.getByLabel("Quantity").fill("2");
  await page.getByRole("button", { name: "Buy" }).click();
  await expect(page).toHaveURL(/https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_prd_sample_tote/);
  const landed = new URL(page.url());
  expect(landed.searchParams.get("quantity")).toBe("2");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  await page.goto("/t/harbor-sample/p/prd_sample_tote");
  await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();

  await page.goto("/t/daykodee/p/prd_sample_candle");
  await expect(page.getByText("Out of stock")).toBeVisible();
  await expect(page.getByRole("button", { name: "Buy" })).toBeDisabled();
});
