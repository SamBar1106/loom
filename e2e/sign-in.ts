import { expect, type Page } from "@playwright/test";

export const sampleEmail = "alex.sample@example.com";
export const samplePassword = "sample-password";

export async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(sampleEmail);
  await page.getByLabel("Password", { exact: true }).fill(samplePassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toBeVisible();
}
