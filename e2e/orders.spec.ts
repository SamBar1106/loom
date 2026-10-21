import { expect, test } from "@playwright/test";
import { signIn } from "./sign-in";

test("checkout success and cancel load from the production preview", async ({ page }) => {
  const success = await page.request.get("/t/daykodee/checkout/success?session_id=cs_sample_paid");
  expect(success.status()).toBe(200);
  expect(success.headers()["content-type"]).toContain("text/html");
  expect(await success.text()).toContain('id="root"');

  const cancel = await page.request.get("/t/daykodee/checkout/cancel");
  expect(cancel.status()).toBe(200);
  expect(await cancel.text()).toContain('id="root"');

  await page.goto("/t/daykodee/checkout/success?session_id=cs_sample_paid");
  await expect(page).toHaveURL(/\/t\/daykodee\/checkout\/success\?session_id=cs_sample_paid/);
  await expect(page).not.toHaveURL(/sign-in/);
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  await expect(page.locator("[data-page=checkout-success]")).toBeVisible();
  await expect(page.locator("[data-field=store]")).toContainText("Daykodee Sample Shop");
  await expect(page.locator("[data-field=status]")).toContainText("Paid");
  await expect(page.locator("[data-field=buyer]")).toContainText("buyer.sample@example.com");
  await expect(page.locator("[data-field=amount]")).toContainText("$54.00");
  await expect(page.locator("[data-field=fee]")).toContainText("$2.16");
  await expect(page.locator("[data-field=date]")).toContainText("2026");
  await expect(page.getByText("Sample Tote Bag")).toBeVisible();
  await expect(page.getByText("prd_sample_tote")).toBeVisible();
  await expect(page.getByText("Sample Desk Notebook")).toBeVisible();
  await expect(page.getByText("prd_sample_notebook")).toBeVisible();
  await expect(page.getByText("That API path is not in the Loom contract.")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Orders", exact: true })).toHaveCount(0);

  await page.goto("/t/harbor-sample/checkout/success?session_id=cs_sample_paid");
  await expect(page.getByRole("heading", { name: "Payment received" })).toHaveCount(0);
  await expect(page.getByText("buyer.sample@example.com")).toHaveCount(0);
  await expect(page.getByText("Could not load this page")).toBeVisible();

  await page.goto("/t/daykodee/checkout/success");
  await expect(page.getByRole("heading", { name: "Payment received" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Checkout session missing" })).toBeVisible();

  await page.goto("/t/daykodee/checkout/success?session_id=cs_missing");
  await expect(page.getByRole("heading", { name: "Payment received" })).toHaveCount(0);
  await expect(page.getByText("Could not load this page")).toBeVisible();
  await expect(page.getByText("That API path is not in the Loom contract.")).toHaveCount(0);

  await page.goto("/t/daykodee/checkout/cancel");
  await expect(page).not.toHaveURL(/sign-in/);
  await expect(page.getByRole("heading", { name: "Checkout canceled" })).toBeVisible();
  await expect(page.getByText("No payment was taken.")).toBeVisible();
  await expect(page.locator("[data-page=checkout-cancel]")).toBeVisible();
});

test("orders list and detail come from the tenant order routes", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/daykodee/orders");
  const orders = page.locator("[data-page=orders]");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
  await expect(orders.getByText("buyer.sample@example.com")).toBeVisible();
  await expect(orders.getByText("pending.buyer@example.com")).toBeVisible();
  await expect(orders.getByText("failed.buyer@example.com")).toBeVisible();
  await expect(orders.getByText("Paid", { exact: true })).toBeVisible();
  await expect(orders.getByText("Pending", { exact: true })).toBeVisible();
  await expect(orders.getByText("Failed", { exact: true })).toBeVisible();
  await expect(orders.getByText("$54.00")).toBeVisible();
  await expect(orders.getByText("$2.16")).toBeVisible();
  await expect(orders.getByText("harbor.buyer@example.com")).toHaveCount(0);
  await expect(page.getByText("That API path is not in the Loom contract.")).toHaveCount(0);
  await expect(page.getByText("No orders yet")).toHaveCount(0);

  await page.getByRole("link", { name: "ord_1042" }).click();
  await expect(page).toHaveURL(/\/t\/daykodee\/orders\/ord_1042$/);
  const detail = page.locator("[data-page=order]");
  await expect(detail.locator("[data-field=status]")).toContainText("Paid");
  await expect(detail.locator("[data-field=buyer]")).toContainText("buyer.sample@example.com");
  await expect(detail.locator("[data-field=amount]")).toContainText("$54.00");
  await expect(detail.locator("[data-field=fee]")).toContainText("$2.16");
  await expect(detail.locator("[data-field=date]")).toContainText("2026");
  await expect(detail.getByText("Sample Tote Bag")).toBeVisible();
  await expect(detail.getByText("prd_sample_tote")).toBeVisible();
  await expect(detail.getByText("Sample Desk Notebook")).toBeVisible();
  await expect(detail.getByText("Qty 2")).toBeVisible();
  await expect(page.getByText("That API path is not in the Loom contract.")).toHaveCount(0);

  await page.goto("/t/daykodee/orders/ord_h14");
  await expect(page.getByText("Could not load this page")).toBeVisible();
  await expect(page.getByText("harbor.buyer@example.com")).toHaveCount(0);

  await page.goto("/t/harbor-sample/orders");
  await expect(page.getByText("harbor.buyer@example.com")).toBeVisible();
  await expect(page.getByText("buyer.sample@example.com")).toHaveCount(0);
  await page.getByRole("link", { name: "ord_h14" }).click();
  await expect(page).toHaveURL(/\/t\/harbor-sample\/orders\/ord_h14$/);
  await expect(page.locator("[data-page=order]").locator("[data-field=buyer]")).toContainText(
    "harbor.buyer@example.com",
  );
  await expect(page.getByText("Sample Harbor Lantern")).toBeVisible();
  await expect(page.getByText("prd_harbor_lantern")).toBeVisible();
});
