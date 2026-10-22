import { expect, test } from "@playwright/test";

const draftBanner = "Draft — pending owner and legal review";

test("terms and privacy pages render and footer links work", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.locator("[data-page=terms]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(draftBanner);
  await expect(page.getByText("Last updated: [DATE]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acceptable use" })).toBeVisible();
  await expect(page.getByText("2.9% of the charge amount plus $0.30")).toBeVisible();
  await expect(page.getByText("Orion Multiservices LLC, Clearwater, Florida.").first()).toBeVisible();
  await expect(page.getByText("[CONTACT EMAIL]").first()).toBeVisible();

  await page.goto("/privacy");
  await expect(page.locator("[data-page=privacy]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(draftBanner);
  await expect(page.getByText("Last updated: [DATE]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Children under 13" })).toBeVisible();
  await expect(page.getByText("Loom does not store card numbers.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your requests, including California" })).toBeVisible();

  await page.goto("/t/daykodee");
  await expect(page.locator("[data-page=storefront]")).toBeVisible();
  const storeFooter = page.getByRole("contentinfo");
  await storeFooter.getByRole("link", { name: "Terms of Service" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(draftBanner);

  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();

  await page.goto("/sign-up");
  const agreement = page.getByText("By creating an account, you agree to the");
  await agreement.getByRole("link", { name: "Terms of Service" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole("status")).toHaveText(draftBanner);

  await page.goto("/t/daykodee/p/prd_sample_tote");
  const checkoutNote = page.getByText("The shop is the seller and handles refunds and taxes.");
  await checkoutNote.getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Children under 13" })).toBeVisible();
});
