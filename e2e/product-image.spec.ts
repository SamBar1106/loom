import { expect, test } from "@playwright/test";
import { signIn } from "./sign-in";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("product editor uploads an image to the product image route", async ({ page }) => {
  await signIn(page);
  await page.goto("/t/daykodee/products/new");
  await expect(page.getByLabel("Upload image")).toBeDisabled();
  await expect(page.getByText("Save the product before adding an image.")).toBeVisible();

  await page.goto("/t/daykodee/products/prd_sample_tote");
  await expect(page.getByLabel("Title")).toHaveValue("Sample Tote Bag");

  await page.getByLabel("Upload image").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });
  await expect(page.getByText("Use a JPEG, PNG, WebP, or GIF.")).toBeVisible();

  await page.getByLabel("Upload image").setInputFiles({
    name: "shelf.png",
    mimeType: "image/png",
    buffer: png,
  });
  const image = page.getByRole("img", { name: "shelf.png" });
  await expect(image).toBeVisible();
  await expect.poll(async () => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText("Image uploaded.")).toBeVisible();
  await expect(page.getByText("Unsaved changes")).toHaveCount(0);
});
