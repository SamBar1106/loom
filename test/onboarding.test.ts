import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dismissShopSetup,
  isShopSetupDismissed,
  shopSetupProgress,
  shopSetupSteps,
} from "@/lib/onboarding";

class MemoryStorage {
  #data = new Map<string, string>();

  get length(): number {
    return this.#data.size;
  }

  getItem(key: string): string | null {
    return this.#data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#data.set(key, String(value));
  }

  removeItem(key: string): void {
    this.#data.delete(key);
  }

  clear(): void {
    this.#data.clear();
  }

  key(index: number): string | null {
    return [...this.#data.keys()][index] ?? null;
  }
}

const emptyShop = {
  storeName: "   ",
  productCount: 0,
  stripeAccountId: null,
  publicProductCount: 0,
};

test("shop setup lists the four first-run steps from API facts", () => {
  const steps = shopSetupSteps(emptyShop);
  assert.deepEqual(
    steps.map((step) => step.label),
    ["Name your shop", "Add first product", "Connect Stripe payments", "View your public shop link"],
  );
  assert.equal(steps.every((step) => step.done), false);
  assert.deepEqual(shopSetupProgress(steps), { completed: 0, total: 4 });
});

test("shop setup marks a step done only from the matching API fact", () => {
  const named = shopSetupSteps({ ...emptyShop, storeName: "North Goods" });
  assert.equal(named.find((step) => step.id === "name")?.done, true);
  assert.equal(named.find((step) => step.id === "product")?.done, false);

  const withProduct = shopSetupSteps({ ...emptyShop, storeName: "North Goods", productCount: 1 });
  assert.equal(withProduct.find((step) => step.id === "product")?.done, true);
  assert.equal(withProduct.find((step) => step.id === "link")?.done, false);

  const published = shopSetupSteps({
    ...emptyShop,
    storeName: "North Goods",
    productCount: 1,
    publicProductCount: 2,
  });
  assert.equal(published.find((step) => step.id === "link")?.done, true);
  assert.equal(published.find((step) => step.id === "stripe")?.done, false);

  const connected = shopSetupSteps({
    storeName: "North Goods",
    productCount: 3,
    stripeAccountId: "acct_123",
    publicProductCount: 1,
  });
  assert.equal(connected.every((step) => step.done), true);
  assert.deepEqual(shopSetupProgress(connected), { completed: 4, total: 4 });
});

test("a blank Stripe id does not count as connected", () => {
  const steps = shopSetupSteps({ ...emptyShop, storeName: "North Goods", stripeAccountId: "  " });
  assert.equal(steps.find((step) => step.id === "stripe")?.done, false);
});

test("dismissing shop setup is stored per tenant", () => {
  const storage = new MemoryStorage();
  assert.equal(isShopSetupDismissed("ten_daykodee", storage), false);
  dismissShopSetup("ten_daykodee", storage);
  assert.equal(isShopSetupDismissed("ten_daykodee", storage), true);
  assert.equal(isShopSetupDismissed("ten_harbor", storage), false);
  dismissShopSetup("ten_daykodee", storage);
  assert.equal(isShopSetupDismissed("ten_daykodee", storage), true);
});
