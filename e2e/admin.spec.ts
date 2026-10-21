import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { signIn } from "./sign-in";

const widths = [1024, 1280] as const;

test.beforeAll(async () => {
  await mkdir("docs/screenshots", { recursive: true });
});

for (const width of widths) {
  test(`captures the admin at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/screenshots/dashboard-${width}.png`,
      fullPage: true,
    });

    await page.getByRole("link", { name: "Products", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sample Tote Bag/ })).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/products-${width}.png`,
      fullPage: true,
    });

    await page.getByRole("link", { name: /Sample Tote Bag/ }).click();
    await expect(page.getByRole("heading", { name: "Sample Tote Bag" })).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue("Sample Tote Bag");
    await page.screenshot({
      path: `docs/screenshots/product-edit-${width}.png`,
      fullPage: true,
    });
  });
}

test("filters products, edits a draft, and isolates tenants", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page);
  await page.goto("/t/daykodee/products");
  await page.getByRole("textbox", { name: "Search products", exact: true }).fill("tote");
  await expect(page.getByRole("link", { name: /Sample Tote Bag/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sample Ceramic Mug/ })).toHaveCount(0);

  await page.getByRole("link", { name: /Sample Tote Bag/ }).click();
  await page.getByLabel("Title").fill("Sample Tote Bag edited");
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByLabel("Title")).toHaveValue("Sample Tote Bag");

  const price = page.getByRole("textbox", { name: "Price", exact: true });
  await price.fill("33.00");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Product saved.")).toBeVisible();
  await expect(price).toHaveValue("33.00");
  await expect(page.getByText("Unsaved changes")).toHaveCount(0);

  const quickActions = page.getByRole("button", { name: "Quick actions" });
  const home = page.getByRole("link", { name: "Home", exact: true });
  expect(await quickActions.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await home.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await page.getByRole("textbox", { name: "Title", exact: true }).evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows).toBe(false);

  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page.getByText("buyer.sample@example.com")).toBeVisible();
  await expect(page.getByText("harbor.buyer@example.com")).toHaveCount(0);

  await page.getByRole("button", { name: "Daykodee" }).click();
  await page.getByRole("menuitem", { name: "Harbor Sample" }).click();
  await expect(page).toHaveURL(/\/t\/harbor-sample\/orders/);
  await expect(page.getByText("harbor.buyer@example.com")).toBeVisible();
  await expect(page.getByText("buyer.sample@example.com")).toHaveCount(0);
  await page.getByRole("link", { name: "Products", exact: true }).click();
  await expect(page.getByRole("link", { name: /Sample Harbor Lantern/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sample Tote Bag/ })).toHaveCount(0);
});
