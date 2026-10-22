import { expect, test } from "@playwright/test";
import { signIn } from "./sign-in";

test("shop setup tracks API data and can be dismissed", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Setup 3 of 4 tasks")).toBeVisible();

  const setup = page.locator("[data-section=shop-setup]");
  await expect(setup.getByText("3 of 4")).toBeVisible();
  await expect(setup.locator("[data-step=name]")).toHaveAttribute("data-complete", "true");
  await expect(setup.locator("[data-step=product]")).toHaveAttribute("data-complete", "true");
  await expect(setup.locator("[data-step=stripe]")).toHaveAttribute("data-complete", "false");
  await expect(setup.locator("[data-step=link]")).toHaveAttribute("data-complete", "true");
  await expect(setup.getByText("/t/daykodee")).toBeVisible();

  await setup.getByRole("link", { name: /Connect Stripe payments/ }).click();
  await expect(page).toHaveURL(/\/t\/daykodee\/settings\/payments/);
  await expect(page.getByRole("button", { name: "Connect with Stripe" })).toBeVisible();

  await page.goto("/t/daykodee");
  await page.locator("[data-section=shop-setup]").getByRole("link", { name: /View your public shop link/ }).click();
  await expect(page).toHaveURL(/\/t\/daykodee\?view=shop/);
  await expect(page.getByRole("heading", { name: "Daykodee Sample Shop" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sample Tote Bag" })).toBeVisible();

  await page.getByRole("link", { name: "Admin", exact: true }).click();
  await expect(page).toHaveURL(/\/t\/daykodee$/);
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.locator("[data-section=shop-setup]")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toBeVisible();
  await expect(page.locator("[data-section=shop-setup]")).toHaveCount(0);
  await expect(page.getByText("Setup 3 of 4 tasks")).toBeVisible();
});

test("a connected shop hides the setup checklist", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/harbor-sample");
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toBeVisible();
  await expect(page.getByText("Setup 4 of 4 tasks")).toBeVisible();
  await expect(page.locator("[data-section=shop-setup]")).toHaveCount(0);
  await expect(page.getByText("Name your shop")).toHaveCount(0);
});
