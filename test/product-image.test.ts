import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { mockDispatch, resetMockStore } from "@/lib/api/mock/dispatch";
import { productImagePath } from "@/lib/api/product-image";

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

async function signIn(): Promise<void> {
  const response = await call("POST", "/v1/auth/session", {
    email: "alex.sample@example.com",
    password: "sample-password",
  });
  assert.equal(response.status, 200);
}

function pngFile(name = "shelf.png"): File {
  const bytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  return new File([bytes], name, { type: "image/png" });
}

test("product image path targets the multipart upload route", () => {
  assert.equal(productImagePath("prd_sample_tote"), "/v1/products/prd_sample_tote/image");
  assert.equal(productImagePath("a/b"), "/v1/products/a%2Fb/image");
});

test("uploading an image appends multipart field file onto the product", async () => {
  await signIn();
  const form = new FormData();
  form.set("file", pngFile());
  const uploaded = await read(
    await call("POST", productImagePath("prd_sample_tote"), form, "ten_daykodee"),
  );
  assert.equal(uploaded.status, 200);
  const media = uploaded.body.media as { url: string; alt: string; position: number }[];
  assert.equal(media.length, 2);
  const added = media[1];
  assert.ok(added);
  assert.equal(added.alt, "shelf.png");
  assert.equal(added.position, 1);
  assert.match(added.url, /^data:image\/png;base64,/);

  const loaded = await read(await call("GET", "/v1/products/prd_sample_tote", undefined, "ten_daykodee"));
  const stored = loaded.body.media as { alt: string }[];
  assert.equal(stored.some((item) => item.alt === "shelf.png"), true);

  const listed = await read(await call("GET", "/v1/products?page=1&pageSize=8", undefined, "ten_daykodee"));
  const row = (listed.body.data as { id: string; thumbnailUrl: string | null }[]).find(
    (item) => item.id === "prd_sample_tote",
  );
  assert.equal(typeof row?.thumbnailUrl, "string");
});

test("image upload rejects a missing, empty, or non-image file", async () => {
  await signIn();
  const missing = await read(await call("POST", productImagePath("prd_sample_tote"), undefined, "ten_daykodee"));
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error && (missing.body.error as { code: string }).code, "validation_error");

  const wrongField = new FormData();
  wrongField.set("image", pngFile());
  const wrong = await read(await call("POST", productImagePath("prd_sample_tote"), wrongField, "ten_daykodee"));
  assert.equal(wrong.status, 400);

  const empty = new FormData();
  empty.set("file", new File([], "empty.png", { type: "image/png" }));
  const emptyResponse = await read(
    await call("POST", productImagePath("prd_sample_tote"), empty, "ten_daykodee"),
  );
  assert.equal(emptyResponse.status, 400);

  const text = new FormData();
  text.set("file", new File(["hello"], "notes.txt", { type: "text/plain" }));
  const rejected = await read(await call("POST", productImagePath("prd_sample_tote"), text, "ten_daykodee"));
  assert.equal(rejected.status, 400);
  const details = (rejected.body.error as { details?: { field?: string; message: string }[] }).details ?? [];
  assert.equal(details[0]?.field, "file");
  assert.match(details[0]?.message ?? "", /JPEG, PNG, WebP, or GIF/);
});

test("image upload requires a session, a tenant, and a real product", async () => {
  const signedOut = await read(
    await call("POST", productImagePath("prd_sample_tote"), new FormData(), "ten_daykodee"),
  );
  assert.equal(signedOut.status, 401);

  await signIn();
  const noTenant = await read(await call("POST", productImagePath("prd_sample_tote"), new FormData()));
  assert.equal(noTenant.status, 400);
  assert.equal((noTenant.body.error as { code: string }).code, "tenant_required");

  const form = new FormData();
  form.set("file", pngFile());
  const missing = await read(await call("POST", productImagePath("prd_missing"), form, "ten_daykodee"));
  assert.equal(missing.status, 404);

  const otherTenant = await read(await call("POST", productImagePath("prd_sample_tote"), form, "ten_harbor"));
  assert.equal(otherTenant.status, 404);
});
