import { inventoryStatus } from "@/lib/inventory";
import { slugify } from "@/lib/format";
import { hoursBeforeSampleNow } from "@/lib/sample-clock";
import { isHttpUrl } from "@/lib/stripe-connect";
import type {
  ApiErrorDetail,
  Category,
  DashboardRange,
  InventoryItem,
  InventoryStatus,
  OptionWrite,
  Page,
  Product,
  ProductListItem,
  ProductMedia,
  ProductOption,
  ProductPatch,
  ProductVariant,
  ProductWrite,
  VariantPatch,
  VariantWrite,
} from "@/lib/api/types";
import { handleAuth, hasMockSession, resetAuthMock } from "@/lib/api/mock/auth";
import { createSeed, type TenantBucket } from "@/lib/api/mock/seed";

export type MockRequest = {
  method: string;
  path: string;
  query: URLSearchParams;
  tenantId: string | null;
  body: unknown;
};

const buckets = new Map<string, TenantBucket>();
for (const bucket of createSeed()) {
  buckets.set(bucket.tenant.id, bucket);
}

let idCounter = 100;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

function error(status: number, code: string, message: string, details?: ApiErrorDetail[]): Response {
  return Response.json({ error: { code, message, details } }, { status });
}

function ok(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function empty(): Response {
  return new Response(null, { status: 204 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireTenant(tenantId: string | null): TenantBucket | Response {
  if (!tenantId) {
    return error(400, "tenant_required", "Send the tenant id in the X-Tenant-Id header.");
  }
  const bucket = buckets.get(tenantId);
  if (!bucket) {
    return error(404, "tenant_not_found", "No tenant matches that id.");
  }
  return bucket;
}

function isBucket(value: TenantBucket | Response): value is TenantBucket {
  return !(value instanceof Response);
}

const MONEY = /^\d+\.\d{2}$/;

function invalid(details: ApiErrorDetail[]): Response {
  return error(400, "validation_error", "Check the highlighted fields.", details);
}

function available(variant: ProductVariant): number {
  return variant.onHand - variant.reserved;
}

function productAvailable(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + available(variant), 0);
}

function syncDerived(product: Product): void {
  if (product.variants.length === 0) return;
  const prices = product.variants.map((variant) => Number(variant.price));
  product.price = Math.min(...prices).toFixed(2);
  if (product.variants.length === 1) {
    const only = product.variants[0];
    if (!only) return;
    product.compareAtPrice = only.compareAtPrice;
    product.costOfGoods = only.costOfGoods;
  }
}

function refreshCategoryCounts(bucket: TenantBucket): void {
  for (const category of bucket.categories) {
    category.productCount = bucket.products.filter((product) =>
      product.categoryIds.includes(category.id),
    ).length;
  }
}

function categoryNames(bucket: TenantBucket, ids: string[]): string[] {
  return ids
    .map((id) => bucket.categories.find((category) => category.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

function toListItem(bucket: TenantBucket, product: Product): ProductListItem {
  const availableCount = productAvailable(product);
  return {
    id: product.id,
    title: product.title,
    productType: product.productType,
    vendor: product.vendor,
    sku: product.variants[0]?.sku ?? null,
    price: product.price,
    currency: product.currency,
    variantCount: product.variants.length,
    inventoryStatus: inventoryStatus(availableCount),
    available: availableCount,
    categoryNames: categoryNames(bucket, product.categoryIds),
    thumbnailUrl: product.media[0]?.url ?? null,
    updatedAt: product.updatedAt,
  };
}

function toInventory(product: Product): InventoryItem[] {
  return product.variants.map((variant) => {
    const count = available(variant);
    return {
      variantId: variant.id,
      productId: product.id,
      productTitle: product.title,
      variantTitle: variant.title,
      sku: variant.sku,
      onHand: variant.onHand,
      reserved: variant.reserved,
      available: count,
      status: inventoryStatus(count),
    };
  });
}

function paginate<T>(items: T[], query: URLSearchParams): Page<T> | Response {
  const pageRaw = query.get("page") ?? "1";
  const sizeRaw = query.get("pageSize") ?? "8";
  const page = Number(pageRaw);
  const pageSize = Number(sizeRaw);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return invalid([
      { field: "page", message: "page must be an integer >= 1 and pageSize an integer from 1 to 100." },
    ]);
  }
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    page: { page, pageSize, total, totalPages },
  };
}

function readMoney(value: unknown, field: string, details: ApiErrorDetail[], required: boolean): string | null | undefined {
  if (value === undefined) {
    if (required) details.push({ field, message: `${field} is required.` });
    return undefined;
  }
  if (value === null) {
    if (required) details.push({ field, message: `${field} is required.` });
    return null;
  }
  if (typeof value !== "string" || !MONEY.test(value)) {
    details.push({ field, message: `${field} must be a decimal string with two places, such as 32.00.` });
    return undefined;
  }
  return value;
}

function applyProductWrite(product: Product, body: ProductPatch, bucket: TenantBucket, creating: boolean): Response | null {
  const details: ApiErrorDetail[] = [];
  if (creating && (typeof body.title !== "string" || body.title.trim() === "")) {
    details.push({ field: "title", message: "Title is required." });
  }
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim() === "" || body.title.length > 150) {
      details.push({ field: "title", message: "Title is required and must be 150 characters or fewer." });
    } else {
      product.title = body.title.trim();
    }
  }
  if (body.description !== undefined) {
    product.description = typeof body.description === "string" ? body.description : "";
  }
  if (body.productType !== undefined) {
    if (body.productType !== "physical" && body.productType !== "digital" && body.productType !== "service") {
      details.push({ field: "productType", message: "Product type must be physical, digital, or service." });
    } else {
      product.productType = body.productType;
    }
  }
  if (body.vendor !== undefined && typeof body.vendor === "string") product.vendor = body.vendor;
  if (body.tags !== undefined && Array.isArray(body.tags)) {
    product.tags = body.tags.filter((tag): tag is string => typeof tag === "string");
  }
  if (body.primaryBadge !== undefined) {
    product.primaryBadge = typeof body.primaryBadge === "string" && body.primaryBadge.trim() ? body.primaryBadge.trim() : null;
  }
  if (body.categoryIds !== undefined && Array.isArray(body.categoryIds)) {
    const ids = body.categoryIds.filter((id): id is string => typeof id === "string");
    const unknown = ids.find((id) => !bucket.categories.some((category) => category.id === id));
    if (unknown) details.push({ field: "categoryIds", message: "One or more categories do not belong to this tenant." });
    else product.categoryIds = ids;
  }
  if (body.showInOnlineStore !== undefined) product.showInOnlineStore = Boolean(body.showInOnlineStore);
  if (body.showInPointOfSale !== undefined) product.showInPointOfSale = Boolean(body.showInPointOfSale);
  if (body.scheduleAvailability !== undefined) product.scheduleAvailability = Boolean(body.scheduleAvailability);
  if (body.availableFrom !== undefined) {
    product.availableFrom = typeof body.availableFrom === "string" ? body.availableFrom : null;
  }
  if (body.taxGroup !== undefined) {
    product.taxGroup = typeof body.taxGroup === "string" && body.taxGroup.trim() ? body.taxGroup : null;
  }
  if (body.showPricePerUnit !== undefined) product.showPricePerUnit = Boolean(body.showPricePerUnit);
  if (body.unitPriceLabel !== undefined) {
    product.unitPriceLabel = typeof body.unitPriceLabel === "string" && body.unitPriceLabel.trim() ? body.unitPriceLabel : null;
  }

  const price = readMoney(body.price, "price", details, creating);
  const compareAt = readMoney(body.compareAtPrice, "compareAtPrice", details, false);
  const cost = readMoney(body.costOfGoods, "costOfGoods", details, false);
  let nextMedia: ProductMedia[] | undefined;
  if (body.media !== undefined) {
    if (!Array.isArray(body.media)) {
      details.push({ field: "media", message: "Media must be a list." });
    } else {
      nextMedia = body.media.map((item, index) => normalizeMedia(item, index, details));
    }
  }

  if (details.length > 0) return invalid(details);
  if (nextMedia) product.media = nextMedia;

  if (product.variants.length === 1) {
    const only = product.variants[0];
    if (only) {
      if (typeof price === "string") only.price = price;
      if (compareAt !== undefined) only.compareAtPrice = compareAt;
      if (cost !== undefined) only.costOfGoods = cost;
    }
  } else if (typeof price === "string" && product.variants.length === 0) {
    product.variants.push({
      id: nextId("var"),
      title: "Default",
      sku: `SMP-${nextId("sku").slice(-4).toUpperCase()}`,
      price,
      compareAtPrice: compareAt ?? null,
      costOfGoods: cost ?? null,
      optionValues: [],
      onHand: 0,
      reserved: 0,
    });
  }
  syncDerived(product);
  product.updatedAt = hoursBeforeSampleNow(0);
  return null;
}

function normalizeMedia(item: unknown, index: number, details: ApiErrorDetail[]): ProductMedia {
  const media = isRecord(item) ? item : {};
  const url = typeof media.url === "string" ? media.url : "";
  const alt = typeof media.alt === "string" ? media.alt : "";
  if (!url) details.push({ field: `media.${index}.url`, message: "Each media item needs a url." });
  return { id: nextId("med"), url, alt, position: index };
}

function findProduct(bucket: TenantBucket, productId: string): Product | undefined {
  return bucket.products.find((product) => product.id === productId);
}

function parsePositiveInt(value: unknown, field: string, details: ApiErrorDetail[]): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    details.push({ field, message: `${field} must be an integer of 0 or more.` });
    return undefined;
  }
  return value;
}

function listProducts(bucket: TenantBucket, query: URLSearchParams): Response {
  const q = (query.get("q") ?? "").trim().toLowerCase();
  const productType = query.get("productType") ?? "";
  const status = query.get("inventoryStatus") ?? "";
  const categoryId = query.get("categoryId") ?? "";
  const sort = query.get("sort") ?? "updatedAt";
  if (sort !== "title" && sort !== "updatedAt") {
    return invalid([{ field: "sort", message: "sort must be title or updatedAt." }]);
  }
  let items = bucket.products.map((product) => toListItem(bucket, product));
  if (q) {
    items = items.filter((item) => item.title.toLowerCase().includes(q) || (item.sku ?? "").toLowerCase().includes(q));
  }
  if (productType) {
    items = items.filter((item) => item.productType === productType);
  }
  if (status) {
    items = items.filter((item) => item.inventoryStatus === (status as InventoryStatus));
  }
  if (categoryId) {
    items = items.filter((item) => {
      const product = findProduct(bucket, item.id);
      return product?.categoryIds.includes(categoryId);
    });
  }
  items.sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt)));
  const page = paginate(items, query);
  if (page instanceof Response) return page;
  return ok(page);
}

function isDashboardRange(value: string | null): value is DashboardRange {
  return value === "today" || value === "7d" || value === "30d" || value === null;
}

type Route = {
  method: string;
  pattern: RegExp;
  tenant: boolean;
  handle: (bucket: TenantBucket | null, match: RegExpMatchArray, request: MockRequest) => Response;
};

const routes: Route[] = [
  {
    method: "GET",
    pattern: /^\/v1\/tenants$/,
    tenant: false,
    handle: () => ok({ data: [...buckets.values()].map((bucket) => bucket.tenant) }),
  },
  {
    method: "GET",
    pattern: /^\/v1\/tenants\/([^/]+)$/,
    tenant: false,
    handle: (_bucket, match) => {
      const bucket = buckets.get(match[1] ?? "");
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      return ok(bucket.tenant);
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/dashboard$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const range = request.query.get("range");
      if (!isDashboardRange(range)) {
        return invalid([{ field: "range", message: "range must be today, 7d, or 30d." }]);
      }
      const selected = range ?? "today";
      const settings = bucket.settings;
      return ok({
        range: selected,
        setup: bucket.setup,
        store: {
          name: settings.storeName,
          status: settings.status,
          addressLine: `${settings.addressLine}, ${settings.city}, ${settings.region} ${settings.postalCode}`,
          contactEmail: settings.contactEmail,
          supportPhone: settings.supportPhone,
        },
        metrics: bucket.metrics[selected],
        activity: bucket.activity,
      });
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/products$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      return listProducts(bucket, request.query);
    },
  },
  {
    method: "POST",
    pattern: /^\/v1\/products$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const body = (isRecord(request.body) ? request.body : {}) as ProductWrite;
      const created: Product = {
        id: nextId("prd"),
        title: "",
        description: "",
        productType: "physical",
        vendor: "",
        tags: [],
        primaryBadge: null,
        categoryIds: [],
        showInOnlineStore: true,
        showInPointOfSale: false,
        scheduleAvailability: false,
        availableFrom: null,
        price: "0.00",
        compareAtPrice: null,
        costOfGoods: null,
        currency: bucket.settings.currency,
        taxGroup: null,
        showPricePerUnit: false,
        unitPriceLabel: null,
        options: [],
        variants: [],
        media: [],
        createdAt: hoursBeforeSampleNow(0),
        updatedAt: hoursBeforeSampleNow(0),
      };
      const failure = applyProductWrite(created, body, bucket, true);
      if (failure) return failure;
      if (created.variants.length === 0) {
        return invalid([{ field: "price", message: "Price is required." }]);
      }
      bucket.products.unshift(created);
      refreshCategoryCounts(bucket);
      return ok(created, 201);
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/products\/([^/]+)\/variants$/,
    tenant: true,
    handle: (bucket, match) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      if (!product) return error(404, "not_found", "Product was not found in this tenant.");
      return ok({ data: product.variants });
    },
  },
  {
    method: "POST",
    pattern: /^\/v1\/products\/([^/]+)\/variants$/,
    tenant: true,
    handle: (bucket, match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      if (!product) return error(404, "not_found", "Product was not found in this tenant.");
      const body = (isRecord(request.body) ? request.body : {}) as VariantWrite;
      const details: ApiErrorDetail[] = [];
      const price = readMoney(body.price, "price", details, true);
      const onHand = body.onHand === undefined ? 0 : parsePositiveInt(body.onHand, "onHand", details);
      if (typeof body.title !== "string" || !body.title.trim()) details.push({ field: "title", message: "Title is required." });
      if (typeof body.sku !== "string" || !body.sku.trim()) details.push({ field: "sku", message: "SKU is required." });
      if (details.length || typeof price !== "string" || onHand === undefined || typeof body.title !== "string" || typeof body.sku !== "string") {
        return invalid(details);
      }
      const created: ProductVariant = {
        id: nextId("var"),
        title: body.title.trim(),
        sku: body.sku.trim(),
        price,
        compareAtPrice: typeof body.compareAtPrice === "string" ? body.compareAtPrice : null,
        costOfGoods: typeof body.costOfGoods === "string" ? body.costOfGoods : null,
        optionValues: body.optionValues ?? [],
        onHand,
        reserved: body.reserved ?? 0,
      };
      product.variants.push(created);
      syncDerived(product);
      product.updatedAt = hoursBeforeSampleNow(0);
      return ok(created, 201);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/v1\/products\/([^/]+)\/variants\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      const variant = product?.variants.find((item) => item.id === match[2]);
      if (!product || !variant) return error(404, "not_found", "Variant was not found in this tenant.");
      const body = (isRecord(request.body) ? request.body : {}) as VariantPatch;
      const details: ApiErrorDetail[] = [];
      if (body.title !== undefined && typeof body.title === "string") variant.title = body.title;
      if (body.sku !== undefined && typeof body.sku === "string") variant.sku = body.sku;
      const price = readMoney(body.price, "price", details, false);
      const compareAt = readMoney(body.compareAtPrice, "compareAtPrice", details, false);
      const cost = readMoney(body.costOfGoods, "costOfGoods", details, false);
      if (typeof price === "string") variant.price = price;
      if (compareAt !== undefined) variant.compareAtPrice = compareAt;
      if (cost !== undefined) variant.costOfGoods = cost;
      if (body.onHand !== undefined) {
        const onHand = parsePositiveInt(body.onHand, "onHand", details);
        if (onHand !== undefined) variant.onHand = onHand;
      }
      if (body.optionValues !== undefined) variant.optionValues = body.optionValues;
      if (details.length) return invalid(details);
      syncDerived(product);
      product.updatedAt = hoursBeforeSampleNow(0);
      return ok(variant);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/v1\/products\/([^/]+)\/variants\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      if (!product) return error(404, "not_found", "Product was not found in this tenant.");
      const index = product.variants.findIndex((item) => item.id === match[2]);
      if (index < 0) return error(404, "not_found", "Variant was not found in this tenant.");
      if (product.variants.length === 1) {
        return error(409, "conflict", "A product keeps at least one variant.");
      }
      product.variants.splice(index, 1);
      syncDerived(product);
      return empty();
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/products\/([^/]+)\/options$/,
    tenant: true,
    handle: (bucket, match) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      if (!product) return error(404, "not_found", "Product was not found in this tenant.");
      return ok({ data: product.options });
    },
  },
  {
    method: "POST",
    pattern: /^\/v1\/products\/([^/]+)\/options$/,
    tenant: true,
    handle: (bucket, match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      if (!product) return error(404, "not_found", "Product was not found in this tenant.");
      const body = (isRecord(request.body) ? request.body : {}) as OptionWrite;
      if (typeof body.name !== "string" || !Array.isArray(body.values)) {
        return invalid([{ field: "name", message: "Option name and values are required." }]);
      }
      const created: ProductOption = { id: nextId("opt"), name: body.name, values: body.values.filter((value) => typeof value === "string") };
      product.options.push(created);
      return ok(created, 201);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/v1\/products\/([^/]+)\/options\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      const option = product?.options.find((item) => item.id === match[2]);
      if (!option) return error(404, "not_found", "Option was not found in this tenant.");
      const body = isRecord(request.body) ? request.body : {};
      if (typeof body.name === "string") option.name = body.name;
      if (Array.isArray(body.values)) option.values = body.values.filter((value): value is string => typeof value === "string");
      return ok(option);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/v1\/products\/([^/]+)\/options\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      if (!product) return error(404, "not_found", "Product was not found in this tenant.");
      const index = product.options.findIndex((item) => item.id === match[2]);
      if (index < 0) return error(404, "not_found", "Option was not found in this tenant.");
      product.options.splice(index, 1);
      return empty();
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/products\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      if (!product) return error(404, "not_found", "Product was not found in this tenant.");
      return ok(product);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/v1\/products\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const product = findProduct(bucket, match[1] ?? "");
      if (!product) return error(404, "not_found", "Product was not found in this tenant.");
      const body = (isRecord(request.body) ? request.body : {}) as ProductPatch;
      const draft = structuredClone(product);
      const failure = applyProductWrite(draft, body, bucket, false);
      if (failure) return failure;
      Object.assign(product, draft);
      refreshCategoryCounts(bucket);
      return ok(product);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/v1\/products\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const index = bucket.products.findIndex((product) => product.id === match[1]);
      if (index < 0) return error(404, "not_found", "Product was not found in this tenant.");
      bucket.products.splice(index, 1);
      refreshCategoryCounts(bucket);
      return empty();
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/inventory$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const q = (request.query.get("q") ?? "").trim().toLowerCase();
      const status = request.query.get("inventoryStatus") ?? "";
      let items = bucket.products.flatMap(toInventory);
      if (q) {
        items = items.filter((item) =>
          item.productTitle.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q),
        );
      }
      if (status) items = items.filter((item) => item.status === status);
      const page = paginate(items, request.query);
      if (page instanceof Response) return page;
      return ok(page);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/v1\/inventory\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const variantId = match[1];
      for (const product of bucket.products) {
        const variant = product.variants.find((item) => item.id === variantId);
        if (!variant) continue;
        const onHand = isRecord(request.body) ? request.body.onHand : undefined;
        const details: ApiErrorDetail[] = [];
        const parsed = parsePositiveInt(onHand, "onHand", details);
        if (parsed === undefined) return invalid(details);
        variant.onHand = parsed;
        product.updatedAt = hoursBeforeSampleNow(0);
        return ok(toInventory(product).find((item) => item.variantId === variant.id));
      }
      return error(404, "not_found", "Inventory row was not found in this tenant.");
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/categories$/,
    tenant: true,
    handle: (bucket) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      refreshCategoryCounts(bucket);
      return ok({ data: bucket.categories });
    },
  },
  {
    method: "POST",
    pattern: /^\/v1\/categories$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const name = isRecord(request.body) && typeof request.body.name === "string" ? request.body.name.trim() : "";
      if (!name) return invalid([{ field: "name", message: "Name is required." }]);
      const created: Category = { id: nextId("cat"), name, slug: slugify(name), productCount: 0 };
      bucket.categories.push(created);
      return ok(created, 201);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/v1\/categories\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const category = bucket.categories.find((item) => item.id === match[1]);
      if (!category) return error(404, "not_found", "Category was not found in this tenant.");
      const name = isRecord(request.body) && typeof request.body.name === "string" ? request.body.name.trim() : "";
      if (!name) return invalid([{ field: "name", message: "Name is required." }]);
      category.name = name;
      category.slug = slugify(name);
      return ok(category);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/v1\/categories\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const index = bucket.categories.findIndex((item) => item.id === match[1]);
      if (index < 0) return error(404, "not_found", "Category was not found in this tenant.");
      const [removed] = bucket.categories.splice(index, 1);
      if (removed) {
        for (const product of bucket.products) {
          product.categoryIds = product.categoryIds.filter((id) => id !== removed.id);
        }
      }
      return empty();
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/orders$/,
    tenant: true,
    handle: (_bucket, _match, request) => {
      const page = paginate([], request.query);
      if (page instanceof Response) return page;
      return ok(page);
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/orders\/([^/]+)$/,
    tenant: true,
    handle: () => error(404, "not_found", "Order was not found in this tenant."),
  },
  {
    method: "GET",
    pattern: /^\/v1\/inbox$/,
    tenant: true,
    handle: (bucket) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      return ok({
        data: bucket.threads,
        unreadCount: bucket.threads.filter((thread) => thread.unread).length,
      });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/v1\/inbox\/([^/]+)$/,
    tenant: true,
    handle: (bucket, match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      const thread = bucket.threads.find((item) => item.id === match[1]);
      if (!thread) return error(404, "not_found", "Message was not found in this tenant.");
      if (isRecord(request.body) && typeof request.body.unread === "boolean") thread.unread = request.body.unread;
      return ok(thread);
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/store-settings$/,
    tenant: true,
    handle: (bucket) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      return ok(bucket.settings);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/v1\/store-settings$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      if (!isRecord(request.body)) return invalid([{ field: "body", message: "Expected an object." }]);
      const details: ApiErrorDetail[] = [];
      const next = { ...bucket.settings };
      const stringFields = ["storeName", "contactEmail", "supportPhone", "addressLine", "city", "region", "postalCode", "timezone", "currency"] as const;
      for (const field of stringFields) {
        if (request.body[field] !== undefined) {
          if (typeof request.body[field] !== "string" || request.body[field].trim() === "") {
            details.push({ field, message: `${field} must be a non-empty string.` });
          } else {
            next[field] = request.body[field].trim();
          }
        }
      }
      if (next.contactEmail && !next.contactEmail.includes("@")) {
        details.push({ field: "contactEmail", message: "Enter an email address." });
      }
      if (details.length) return invalid(details);
      bucket.settings = next;
      return ok(bucket.settings);
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/payments-settings$/,
    tenant: true,
    handle: (bucket) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      return ok(bucket.payments);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/v1\/payments-settings$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      if (!isRecord(request.body)) return invalid([{ field: "body", message: "Expected an object." }]);
      const next = { ...bucket.payments };
      if (typeof request.body.acceptCard === "boolean") next.acceptCard = request.body.acceptCard;
      if (typeof request.body.acceptManual === "boolean") next.acceptManual = request.body.acceptManual;
      if (typeof request.body.testMode === "boolean") next.testMode = request.body.testMode;
      if (typeof request.body.statementDescriptor === "string") {
        next.statementDescriptor = request.body.statementDescriptor.slice(0, 22);
      }
      bucket.payments = next;
      return ok(bucket.payments);
    },
  },
  {
    method: "GET",
    pattern: /^\/v1\/stripe\/account$/,
    tenant: true,
    handle: (bucket) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      return ok({ ...bucket.stripe });
    },
  },
  {
    method: "POST",
    pattern: /^\/v1\/stripe\/accounts$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      if (request.body !== undefined && request.body !== null) {
        if (!isRecord(request.body) || Object.keys(request.body).length > 0) {
          return invalid([{ field: "body", message: "Creating a Stripe account does not take fields." }]);
        }
      }
      if (bucket.stripe.id) return ok({ ...bucket.stripe });
      bucket.stripeCreates += 1;
      bucket.stripe = {
        id: `acct_sample_${bucket.tenant.id}`,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
      return ok({ ...bucket.stripe }, 201);
    },
  },
  {
    method: "POST",
    pattern: /^\/v1\/stripe\/onboarding-links$/,
    tenant: true,
    handle: (bucket, _match, request) => {
      if (!bucket) return error(404, "tenant_not_found", "No tenant matches that id.");
      if (!bucket.stripe.id) {
        return error(409, "conflict", "Connect a Stripe account before opening onboarding.");
      }
      const linkBody = readOnboardingBody(request.body);
      if (linkBody instanceof Response) return linkBody;
      return ok({
        url: sampleOnboardingUrl(bucket.stripe.id, bucket.stripeCreates, linkBody.returnUrl),
      });
    },
  },
];

function readOnboardingBody(body: unknown): { returnUrl?: string; refreshUrl?: string } | Response {
  if (body === undefined || body === null) return {};
  if (!isRecord(body)) return invalid([{ field: "body", message: "Expected an object." }]);
  const details: ApiErrorDetail[] = [];
  const unexpected = Object.keys(body).filter((key) => key !== "returnUrl" && key !== "refreshUrl");
  if (unexpected.length > 0) {
    details.push({ field: unexpected[0], message: "Only returnUrl and refreshUrl are accepted." });
  }
  let returnUrl: string | undefined;
  let refreshUrl: string | undefined;
  if (body.returnUrl !== undefined) {
    if (typeof body.returnUrl !== "string" || !isHttpUrl(body.returnUrl)) {
      details.push({ field: "returnUrl", message: "Enter an http(s) URL." });
    } else {
      returnUrl = body.returnUrl;
    }
  }
  if (body.refreshUrl !== undefined) {
    if (typeof body.refreshUrl !== "string" || !isHttpUrl(body.refreshUrl)) {
      details.push({ field: "refreshUrl", message: "Enter an http(s) URL." });
    } else {
      refreshUrl = body.refreshUrl;
    }
  }
  if (details.length > 0) return invalid(details);
  return { returnUrl, refreshUrl };
}

/** Sample link only. The live API returns Stripe's URL; the query records what the mock did. */
function sampleOnboardingUrl(accountId: string, creates: number, returnUrl: string | undefined): string {
  const url = new URL(`https://connect.stripe.com/setup/s/${accountId}`);
  url.searchParams.set("creates", String(creates));
  if (returnUrl) url.searchParams.set("return", returnUrl);
  return url.toString();
}

export async function mockDispatch(request: MockRequest): Promise<Response> {
  const path = request.path.split("?")[0] ?? request.path;
  const auth = handleAuth({ ...request, path }, [...buckets.keys()]);
  if (auth) return auth;
  if (!hasMockSession()) {
    return error(401, "unauthenticated", "Sign in to continue.");
  }
  for (const route of routes) {
    if (route.method !== request.method) continue;
    const match = route.pattern.exec(path);
    if (!match) continue;
    if (!route.tenant) return route.handle(null, match, request);
    const bucket = requireTenant(request.tenantId);
    if (!isBucket(bucket)) return bucket;
    return route.handle(bucket, match, request);
  }
  return error(404, "not_found", "That API path is not in the Loom contract.");
}

export function resetMockStore(): void {
  buckets.clear();
  for (const bucket of createSeed()) buckets.set(bucket.tenant.id, bucket);
  idCounter = 100;
  resetAuthMock();
}
