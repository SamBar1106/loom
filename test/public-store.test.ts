import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { mockDispatch, resetMockStore } from "@/lib/api/mock/dispatch";
import { publicCheckoutPath, startPublicCheckout } from "@/lib/api/public-store";

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

before(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
});

afterEach(() => {
  resetMockStore();
});

async function read(response: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  const text = await response.text();
  return {
    status: response.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
  };
}

function call(method: string, path: string, body?: unknown, tenantId?: string) {
  return mockDispatch({
    method,
    path,
    query: new URLSearchParams(),
    tenantId: tenantId ?? null,
    body,
  });
}

test("public checkout path is the loom-api contract", async () => {
  assert.equal(publicCheckoutPath, "/v1/public/checkout");
  const seen: { path: string; options: { method?: string; body?: unknown } }[] = [];
  const result = await startPublicCheckout(
    { storeSlug: "daykodee", productId: "prd_sample_tote", quantity: 2 },
    async (path, options) => {
      seen.push({ path, options });
      return { url: "https://checkout.stripe.com/c/pay/cs_test_tote" };
    },
  );
  assert.deepEqual(seen, [
    {
      path: "/v1/public/checkout",
      options: {
        method: "POST",
        body: { storeSlug: "daykodee", productId: "prd_sample_tote", quantity: 2 },
      },
    },
  ]);
  assert.equal(result.url, "https://checkout.stripe.com/c/pay/cs_test_tote");
});

test("public catalog lists online products and checkout returns a url", async () => {
  const list = await read(await call("GET", "/v1/public/stores/daykodee/products"));
  assert.equal(list.status, 200);
  const data = list.body.data as { id: string }[];
  assert.ok(data.some((item) => item.id === "prd_sample_tote"));
  assert.equal((list.body.store as { slug: string }).slug, "daykodee");

  const hidden = await read(await call("GET", "/v1/public/stores/missing-store/products"));
  assert.equal(hidden.status, 404);

  await call(
    "POST",
    "/v1/auth/session",
    { email: "alex.sample@example.com", password: "sample-password" },
  );
  const patched = await read(
    await call("PATCH", "/v1/products/prd_sample_tote", { showInOnlineStore: false }, "ten_daykodee"),
  );
  assert.equal(patched.status, 200);

  const after = await read(await call("GET", "/v1/public/stores/daykodee/products"));
  const ids = (after.body.data as { id: string }[]).map((item) => item.id);
  assert.equal(ids.includes("prd_sample_tote"), false);

  const missingProduct = await read(await call("GET", "/v1/public/stores/daykodee/products/prd_sample_tote"));
  assert.equal(missingProduct.status, 404);

  const checkout = await read(
    await call("POST", "/v1/public/checkout", {
      storeSlug: "daykodee",
      productId: "prd_sample_mug",
      quantity: 2,
    }),
  );
  assert.equal(checkout.status, 200);
  const url = new URL(String(checkout.body.url));
  assert.equal(url.protocol, "https:");
  assert.equal(url.username, "");
  assert.equal(url.searchParams.get("quantity"), "2");

  const badQuantity = await read(
    await call("POST", "/v1/public/checkout", {
      storeSlug: "daykodee",
      productId: "prd_sample_mug",
      quantity: 0,
    }),
  );
  assert.equal(badQuantity.status, 400);
});
