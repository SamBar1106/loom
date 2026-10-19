import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { sampleEmail, samplePassword, signIn } from "./sign-in";

const widths = [1024, 1280] as const;

test.beforeAll(async () => {
  await mkdir("docs/screenshots", { recursive: true });
});

for (const width of widths) {
  test(`captures sign-in and create account at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("ADMIN")).toHaveCount(0);
    await expect(page.getByText(/store administrator/i)).toHaveCount(0);
    expect(
      await page.getByRole("button", { name: "Sign in", exact: true }).evaluate((element) => element.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(44);
    expect(
      await page.getByLabel("Email").evaluate((element) => element.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(44);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/screenshots/sign-in-${width}.png`,
      fullPage: true,
    });

    await page.getByLabel("Email").fill(sampleEmail);
    await page.getByLabel("Password", { exact: true }).fill("not-the-sample");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
    await page.screenshot({
      path: `docs/screenshots/sign-in-error-${width}.png`,
      fullPage: true,
    });

    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await expect(page.getByText("ADMIN")).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/screenshots/sign-up-${width}.png`,
      fullPage: true,
    });

    await page.getByLabel("Full name").fill("Casey Sample");
    await page.getByLabel("Email").fill("casey.sample@example.com");
    await page.getByLabel("Password", { exact: true }).fill(samplePassword);
    await page.getByLabel("Confirm password").fill(samplePassword);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByText("Sign-up is invite-only for now")).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/sign-up-invite-${width}.png`,
      fullPage: true,
    });

    await page.goto("/sign-in");
    await page.getByRole("switch", { name: "Rate limit" }).click();
    await page.getByLabel("Email").fill(sampleEmail);
    await page.getByLabel("Password", { exact: true }).fill(samplePassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Too many attempts, try again in a few minutes.")).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/sign-in-rate-limit-${width}.png`,
      fullPage: true,
    });

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });
}

test("signs in with the sample account and can show the password", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/sign-in");
  const password = page.getByLabel("Password", { exact: true });
  await password.fill(samplePassword);
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");

  await page.getByLabel("Email").fill(sampleEmail);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toBeVisible();
  await expect(page).toHaveURL(/\/t\/daykodee$/);
  const stored = await page.evaluate(() => ({
    local: window.localStorage.length,
    session: window.sessionStorage.getItem("loom.mock.session"),
  }));
  expect(stored.local).toBe(0);
  expect(stored.session).toContain(sampleEmail);
  expect(stored.session).not.toContain(samplePassword);

  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCount(0);
});

test("shows an error for a wrong password", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("someone.sample@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toHaveCount(0);
});

test("validates create account before it submits", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/sign-up");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await expect(page.getByText("Enter an email address.")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();

  await page.getByLabel("Full name").fill("Casey Sample");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password").fill("short");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Enter an email address.")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();

  await page.getByLabel("Email").fill("casey.sample@example.com");
  await page.getByLabel("Password", { exact: true }).fill(samplePassword);
  await page.getByLabel("Confirm password").fill("different-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up$/);

  const confirm = page.getByLabel("Confirm password");
  await page.getByRole("button", { name: "Show password" }).first().click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await expect(confirm).toBeVisible();
});

test("shows invite-only when create account is disabled", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("Casey Sample");
  await page.getByLabel("Email").fill("casey.sample@example.com");
  await page.getByLabel("Password", { exact: true }).fill(samplePassword);
  await page.getByLabel("Confirm password").fill(samplePassword);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Sign-up is invite-only for now")).toBeVisible();
  await expect(page.getByText("Sign-up is disabled.")).toHaveCount(0);
  await expect(page.getByLabel("Full name")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("shows too many attempts for sign-in and create account", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("switch", { name: "Rate limit" }).click();
  await page.getByLabel("Email").fill(sampleEmail);
  await page.getByLabel("Password", { exact: true }).fill(samplePassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Too many attempts, try again in a few minutes.")).toBeVisible();
  await expect(page.getByText("Incorrect email or password.")).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("Casey Sample");
  await page.getByLabel("Email").fill("casey.sample@example.com");
  await page.getByLabel("Password", { exact: true }).fill(samplePassword);
  await page.getByLabel("Confirm password").fill(samplePassword);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Too many attempts, try again in a few minutes.")).toBeVisible();
  await expect(page.getByText("Sign-up is invite-only for now")).toHaveCount(0);
  await expect(page.getByLabel("Full name")).toBeVisible();
});

test("creates an account when invite-only is turned off", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByRole("switch", { name: "Invite-only" }).click();
  await page.getByLabel("Full name").fill("Casey Sample");
  await page.getByLabel("Email").fill("casey.sample@example.com");
  await page.getByLabel("Password", { exact: true }).fill(samplePassword);
  await page.getByLabel("Confirm password").fill(samplePassword);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Casey" })).toBeVisible();
  await expect(page).toHaveURL(/\/t\/daykodee$/);
  await expect(page.getByText("Account created.")).toHaveCount(0);
  const stored = await page.evaluate(() => ({
    local: window.localStorage.length,
    session: window.sessionStorage.getItem("loom.mock.session"),
  }));
  expect(stored.local).toBe(0);
  expect(stored.session).toContain("casey.sample@example.com");
  expect(stored.session).not.toContain(samplePassword);
});

test("sends unauthenticated visitors to sign in", async ({ page }) => {
  await page.goto("/t/daykodee");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/t/daykodee/products");
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("signs out from the header menu", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page);
  await page.getByRole("button", { name: /Alex Sample/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.goto("/t/daykodee/orders");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("continues with Google through the preview handoff", async ({ page }) => {
  await page.goto("/sign-in");
  const googleStart = page.waitForURL(/\/v1\/auth\/google\/start$/);
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await googleStart;
  await expect(page.getByRole("heading", { name: "Welcome back, Alex" })).toBeVisible();
  await expect(page).toHaveURL(/\/t\/daykodee$/);
});

test("forgot password is a placeholder", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole("heading", { name: "Forgot password" })).toBeVisible();
  await expect(page.getByText("Password reset is not available in this sample.")).toBeVisible();
});
