import { expect, test } from "@playwright/test";
import { signIn } from "./sign-in";

test("admin pages show API data without sample labels", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toBeVisible();
  await expect(page.getByText("Total sales")).toBeVisible();
  await expect(page.getByText("$12,480")).toBeVisible();
  await expect(page.getByText("Sample figures")).toHaveCount(0);
  await expect(page.getByText(/sample store/i)).toHaveCount(0);
  await expect(page.getByText(/sample events/i)).toHaveCount(0);
  await expect(page.getByText("Sample catalog")).toHaveCount(0);
  await expect(page.getByText("Sample", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("Sample notifications")).toHaveCount(0);
  await expect(page.getByText("Notifications")).toBeVisible();

  await page.goto("/t/daykodee/settings");
  await expect(page.getByRole("heading", { name: "Store settings" })).toBeVisible();
  await expect(page.getByLabel("Store name")).toHaveValue("Daykodee Sample Shop");
  await expect(page.getByText(/sample data/i)).toHaveCount(0);

  await page.goto("/t/daykodee/categories");
  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Apparel", exact: true })).toBeVisible();
  await expect(page.getByText(/sample catalog/i)).toHaveCount(0);

  await page.goto("/t/daykodee/products/prd_sample_tote");
  await expect(page.getByLabel("Title")).toHaveValue("Sample Tote Bag");
  await expect(page.getByRole("button", { name: "Add sample image" })).toHaveCount(0);
  await expect(page.getByText(/sample placeholder/i)).toHaveCount(0);
  await expect(page.getByText(/sample product/i)).toHaveCount(0);
  await expect(page.getByText("Formatting is stored as plain text.")).toBeVisible();
});
