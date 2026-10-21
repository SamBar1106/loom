import { expect, test } from "@playwright/test";
import { signIn } from "./sign-in";

test.use({ timezoneId: "America/Chicago" });

const paidAt = "Oct 18, 2026, 5:48 PM";
const failedAt = "Oct 17, 2026, 10:00 PM";

test("checkout success shows the order date in the viewer timezone", async ({ page }) => {
  await page.goto("/t/daykodee/checkout/success?session_id=cs_sample_paid");
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  await expect(page.locator("[data-field=date] dd")).toHaveText(paidAt);
});

test("orders list and detail show order dates in the viewer timezone", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/daykodee/orders");
  const orders = page.locator("[data-page=orders]");
  await expect(orders.getByRole("row", { name: /ord_1042/ })).toContainText(paidAt);
  await expect(orders.getByRole("row", { name: /ord_1044/ })).toContainText(failedAt);

  await page.getByRole("link", { name: "ord_1042" }).click();
  await expect(page).toHaveURL(/\/t\/daykodee\/orders\/ord_1042$/);
  await expect(page.locator("[data-page=order]").locator("[data-field=date] dd")).toHaveText(paidAt);
});
