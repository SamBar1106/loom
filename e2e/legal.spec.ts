import { expect, test } from "@playwright/test";

test("terms and privacy pages render and footer links work", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.locator("[data-page=terms]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeVisible();
  await expect(page.getByText("Draft — pending owner and legal review")).toHaveCount(0);
  await expect(page.getByText("Last updated: October 22, 2026")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acceptable use" })).toBeVisible();
  await expect(page.getByText("Buyers pay only the price the shop lists.")).toBeVisible();
  await expect(page.getByText("Loom does not add a fee to the buyer’s total.")).toBeVisible();
  await expect(
    page.getByText(
      "Loom deducts one transaction fee of 2.9% + 30¢, in United States dollars, from the shop owner’s payout. That fee includes payment processing.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Those Stripe fees are separate")).toHaveCount(0);
  await expect(page.getByText("courts of Pinellas County, Florida")).toBeVisible();
  await expect(page.getByText("Orion Multiservices LLC, Clearwater, Florida.").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "samuelbarrios1106@gmail.com" }).first()).toBeVisible();

  await page.goto("/privacy");
  await expect(page.locator("[data-page=privacy]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
  await expect(page.getByText("Draft — pending owner and legal review")).toHaveCount(0);
  await expect(page.getByText("Last updated: October 22, 2026")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Children under 13" })).toBeVisible();
  await expect(page.getByText("Loom does not store card numbers.")).toBeVisible();
  await expect(page.getByText("Buyers pay only the shop’s listed price.")).toBeVisible();
  await expect(
    page.getByText(
      "transaction fee of 2.9% + 30¢ per successful charge includes payment processing and is deducted from the shop owner’s payout",
    ),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your requests, including California" })).toBeVisible();
  await expect(page.getByRole("link", { name: "samuelbarrios1106@gmail.com" }).first()).toBeVisible();

  await page.goto("/t/daykodee");
  await expect(page.locator("[data-page=storefront]")).toBeVisible();
  const storeFooter = page.getByRole("contentinfo");
  await storeFooter.getByRole("link", { name: "Terms of Service" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeVisible();
  await expect(page.getByText("Last updated: October 22, 2026")).toBeVisible();

  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();

  await page.goto("/sign-up");
  const agreement = page.getByText("By creating an account, you agree to the");
  await agreement.getByRole("link", { name: "Terms of Service" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByText("Buyers pay only the price the shop lists.")).toBeVisible();

  await page.goto("/t/daykodee/p/prd_sample_tote");
  const checkoutNote = page.getByText("The shop is the seller and handles refunds and taxes.");
  await checkoutNote.getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Children under 13" })).toBeVisible();
});
