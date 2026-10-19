import { placeholderImage } from "@/lib/placeholder-image";
import { hoursBeforeSampleNow } from "@/lib/sample-clock";
import type {
  ActivityItem,
  Category,
  DashboardRange,
  Metric,
  PaymentsSettings,
  Product,
  ProductOption,
  ProductType,
  ProductVariant,
  StoreSettings,
  Tenant,
  InboxThread,
} from "@/lib/api/types";

export type TenantBucket = {
  tenant: Tenant;
  settings: StoreSettings;
  payments: PaymentsSettings;
  categories: Category[];
  products: Product[];
  threads: InboxThread[];
  activity: ActivityItem[];
  metrics: Record<DashboardRange, Metric[]>;
  setup: { completed: number; total: number };
};

type VariantInput = {
  id: string;
  title: string;
  sku: string;
  price: string;
  onHand: number;
  reserved?: number;
  compareAtPrice?: string | null;
  costOfGoods?: string | null;
  optionValues?: { name: string; value: string }[];
};

type ProductInput = {
  id: string;
  title: string;
  description: string;
  productType?: ProductType;
  vendor: string;
  categoryIds: string[];
  tags?: string[];
  primaryBadge?: string | null;
  taxGroup?: string | null;
  options?: ProductOption[];
  variants: VariantInput[];
  hue: number;
  mediaLabel: string;
  updatedHoursAgo: number;
  showInPointOfSale?: boolean;
};

function variant(input: VariantInput): ProductVariant {
  return {
    id: input.id,
    title: input.title,
    sku: input.sku,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    costOfGoods: input.costOfGoods ?? null,
    optionValues: input.optionValues ?? [],
    onHand: input.onHand,
    reserved: input.reserved ?? 0,
  };
}

function product(input: ProductInput): Product {
  const variants = input.variants.map(variant);
  const prices = variants.map((item) => Number(item.price));
  const minPrice = Math.min(...prices).toFixed(2);
  const primary = variants[0];
  const createdAt = hoursBeforeSampleNow(input.updatedHoursAgo + 48);
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    productType: input.productType ?? "physical",
    vendor: input.vendor,
    tags: input.tags ?? ["Sample"],
    primaryBadge: input.primaryBadge ?? null,
    categoryIds: input.categoryIds,
    showInOnlineStore: true,
    showInPointOfSale: input.showInPointOfSale ?? true,
    scheduleAvailability: false,
    availableFrom: null,
    price: minPrice,
    compareAtPrice: variants.length === 1 ? (primary?.compareAtPrice ?? null) : null,
    costOfGoods: variants.length === 1 ? (primary?.costOfGoods ?? null) : null,
    currency: "USD",
    taxGroup: input.taxGroup ?? "Standard",
    showPricePerUnit: false,
    unitPriceLabel: null,
    options: input.options ?? [],
    variants,
    media: [
      {
        id: `${input.id}_media`,
        url: placeholderImage(input.mediaLabel, input.hue),
        alt: `${input.title} sample image`,
        position: 0,
      },
    ],
    createdAt,
    updatedAt: hoursBeforeSampleNow(input.updatedHoursAgo),
  };
}

function sizedVariants(
  prefix: string,
  skuPrefix: string,
  price: string,
  cost: string,
  counts: number[],
): { options: ProductOption[]; variants: VariantInput[] } {
  const sizes = ["XS", "S", "M", "L", "XL"].slice(0, counts.length);
  return {
    options: [{ id: `${prefix}_opt_size`, name: "Size", values: sizes }],
    variants: sizes.map((size, index) => ({
      id: `${prefix}_${size.toLowerCase()}`,
      title: size,
      sku: `${skuPrefix}-${size}`,
      price,
      costOfGoods: cost,
      onHand: counts[index] ?? 0,
      optionValues: [{ name: "Size", value: size }],
    })),
  };
}

const sampleCopy =
  "Sample catalog text. Replace this with your own product description.";

function daykodeeProducts(): Product[] {
  const tee = sizedVariants("var_tee", "SMP-TEE", "18.00", "6.50", [8, 12, 14, 8]);
  const cap = {
    options: [
      {
        id: "opt_cap_color",
        name: "Color",
        values: ["Sand", "Ink", "Moss", "Clay"],
      },
    ],
    variants: ["Sand", "Ink", "Moss", "Clay"].map((color) => ({
      id: `var_cap_${color.toLowerCase()}`,
      title: color,
      sku: `SMP-CAP-${color.slice(0, 3).toUpperCase()}`,
      price: "16.00",
      costOfGoods: "4.00",
      onHand: 4,
      optionValues: [{ name: "Color", value: color }],
    })),
  };
  const mug = sizedVariants("var_mug", "SMP-MUG", "14.00", "3.25", [4, 4, 4]);
  const socks = sizedVariants("var_socks", "SMP-SOC", "12.00", "2.40", [2, 2, 2, 2, 1]);
  const candle = sizedVariants("var_candle", "SMP-CND", "22.00", "7.00", [0, 0]);
  const napkin = sizedVariants("var_napkin", "SMP-NAP", "18.00", "5.00", [12, 8]);
  const beanie = sizedVariants("var_beanie", "SMP-BNE", "20.00", "6.00", [3, 2, 2]);
  const pouch = sizedVariants("var_pouch", "SMP-PCH", "19.00", "5.50", [10, 8]);

  return [
    product({
      id: "prd_sample_tee",
      title: "Sample Cotton T-Shirt",
      description: sampleCopy,
      vendor: "Sample Mill",
      categoryIds: ["cat_apparel"],
      tags: ["Sample", "Apparel"],
      primaryBadge: "Sample pick",
      options: tee.options,
      variants: tee.variants,
      hue: 30,
      mediaLabel: "Tee",
      updatedHoursAgo: 2,
    }),
    product({
      id: "prd_sample_cap",
      title: "Sample Baseball Cap",
      description: sampleCopy,
      vendor: "Sample Mill",
      categoryIds: ["cat_accessories"],
      options: cap.options,
      variants: cap.variants,
      hue: 200,
      mediaLabel: "Cap",
      updatedHoursAgo: 5,
    }),
    product({
      id: "prd_sample_bottle",
      title: "Sample Water Bottle",
      description: sampleCopy,
      vendor: "Sample Goods",
      categoryIds: ["cat_drinkware"],
      variants: [
        {
          id: "var_bottle",
          title: "Default",
          sku: "SMP-BTL-001",
          price: "24.00",
          costOfGoods: "8.00",
          onHand: 70,
          reserved: 6,
        },
      ],
      hue: 190,
      mediaLabel: "Bottle",
      updatedHoursAgo: 8,
    }),
    product({
      id: "prd_sample_tote",
      title: "Sample Tote Bag",
      description: sampleCopy,
      vendor: "Sample Goods",
      categoryIds: ["cat_bags"],
      tags: ["Sample", "Everyday"],
      primaryBadge: "Sample pick",
      taxGroup: "Standard",
      variants: [
        {
          id: "var_tote",
          title: "Default",
          sku: "SMP-TOT-001",
          price: "32.00",
          compareAtPrice: "40.00",
          costOfGoods: "12.00",
          onHand: 86,
        },
      ],
      hue: 40,
      mediaLabel: "Tote",
      updatedHoursAgo: 1,
    }),
    product({
      id: "prd_sample_mug",
      title: "Sample Ceramic Mug",
      description: sampleCopy,
      vendor: "Sample Kiln",
      categoryIds: ["cat_drinkware"],
      options: mug.options,
      variants: mug.variants,
      hue: 15,
      mediaLabel: "Mug",
      updatedHoursAgo: 12,
    }),
    product({
      id: "prd_sample_candle",
      title: "Sample Candle Holders",
      description: sampleCopy,
      vendor: "Sample Kiln",
      categoryIds: ["cat_home"],
      options: candle.options,
      variants: candle.variants,
      hue: 50,
      mediaLabel: "Holder",
      updatedHoursAgo: 20,
    }),
    product({
      id: "prd_sample_socks",
      title: "Sample Patterned Socks",
      description: sampleCopy,
      vendor: "Sample Mill",
      categoryIds: ["cat_apparel"],
      options: socks.options,
      variants: socks.variants,
      hue: 280,
      mediaLabel: "Socks",
      updatedHoursAgo: 26,
    }),
    product({
      id: "prd_sample_notebook",
      title: "Sample Desk Notebook",
      description: sampleCopy,
      vendor: "Sample Press",
      categoryIds: ["cat_stationery"],
      variants: [
        {
          id: "var_notebook",
          title: "Default",
          sku: "SMP-NB-001",
          price: "11.00",
          costOfGoods: "2.75",
          onHand: 35,
        },
      ],
      hue: 80,
      mediaLabel: "Notebook",
      updatedHoursAgo: 30,
    }),
    product({
      id: "prd_sample_napkin",
      title: "Sample Linen Napkin",
      description: sampleCopy,
      vendor: "Sample Goods",
      categoryIds: ["cat_home"],
      options: napkin.options,
      variants: napkin.variants,
      hue: 90,
      mediaLabel: "Napkin",
      updatedHoursAgo: 36,
    }),
    product({
      id: "prd_sample_beanie",
      title: "Sample Wool Beanie",
      description: sampleCopy,
      vendor: "Sample Mill",
      categoryIds: ["cat_apparel"],
      options: beanie.options,
      variants: beanie.variants,
      hue: 220,
      mediaLabel: "Beanie",
      updatedHoursAgo: 40,
    }),
    product({
      id: "prd_sample_carafe",
      title: "Sample Glass Carafe",
      description: sampleCopy,
      vendor: "Sample Kiln",
      categoryIds: ["cat_drinkware"],
      variants: [
        {
          id: "var_carafe",
          title: "Default",
          sku: "SMP-CRF-001",
          price: "28.00",
          costOfGoods: "10.00",
          onHand: 15,
        },
      ],
      hue: 170,
      mediaLabel: "Carafe",
      updatedHoursAgo: 48,
    }),
    product({
      id: "prd_sample_apron",
      title: "Sample Canvas Apron",
      description: sampleCopy,
      vendor: "Sample Goods",
      categoryIds: ["cat_apparel"],
      variants: [
        {
          id: "var_apron",
          title: "Default",
          sku: "SMP-APR-001",
          price: "26.00",
          costOfGoods: "9.00",
          onHand: 4,
        },
      ],
      hue: 25,
      mediaLabel: "Apron",
      updatedHoursAgo: 54,
    }),
    product({
      id: "prd_sample_pin",
      title: "Sample Enamel Pin",
      description: sampleCopy,
      vendor: "Sample Press",
      categoryIds: ["cat_accessories"],
      variants: [
        {
          id: "var_pin",
          title: "Default",
          sku: "SMP-PIN-001",
          price: "8.00",
          costOfGoods: "1.50",
          onHand: 50,
        },
      ],
      hue: 330,
      mediaLabel: "Pin",
      updatedHoursAgo: 60,
    }),
    product({
      id: "prd_sample_coaster",
      title: "Sample Cork Coaster",
      description: sampleCopy,
      vendor: "Sample Goods",
      categoryIds: ["cat_home"],
      variants: [
        {
          id: "var_coaster",
          title: "Default",
          sku: "SMP-CST-001",
          price: "9.00",
          costOfGoods: "1.80",
          onHand: 0,
        },
      ],
      hue: 35,
      mediaLabel: "Coaster",
      updatedHoursAgo: 70,
    }),
    product({
      id: "prd_sample_pencils",
      title: "Sample Pencil Set",
      description: sampleCopy,
      vendor: "Sample Press",
      categoryIds: ["cat_stationery"],
      variants: [
        {
          id: "var_pencils",
          title: "Default",
          sku: "SMP-PEN-001",
          price: "7.00",
          costOfGoods: "1.20",
          onHand: 28,
        },
      ],
      hue: 55,
      mediaLabel: "Pencils",
      updatedHoursAgo: 80,
    }),
    product({
      id: "prd_sample_pouch",
      title: "Sample Travel Pouch",
      description: sampleCopy,
      vendor: "Sample Goods",
      categoryIds: ["cat_bags"],
      options: pouch.options,
      variants: pouch.variants,
      hue: 140,
      mediaLabel: "Pouch",
      updatedHoursAgo: 90,
    }),
  ];
}

function harborProducts(): Product[] {
  return [
    product({
      id: "prd_harbor_lantern",
      title: "Sample Harbor Lantern",
      description: sampleCopy,
      vendor: "Harbor Sample",
      categoryIds: ["cat_outdoor"],
      variants: [
        {
          id: "var_lantern",
          title: "Default",
          sku: "HBR-LAN-001",
          price: "36.00",
          costOfGoods: "14.00",
          onHand: 11,
        },
      ],
      hue: 210,
      mediaLabel: "Lantern",
      updatedHoursAgo: 3,
    }),
    product({
      id: "prd_harbor_frame",
      title: "Sample Driftwood Frame",
      description: sampleCopy,
      vendor: "Harbor Sample",
      categoryIds: ["cat_decor"],
      variants: [
        {
          id: "var_frame",
          title: "Default",
          sku: "HBR-FRM-001",
          price: "22.00",
          costOfGoods: "6.00",
          onHand: 3,
        },
      ],
      hue: 28,
      mediaLabel: "Frame",
      updatedHoursAgo: 9,
    }),
    product({
      id: "prd_harbor_pouch",
      title: "Sample Sailcloth Pouch",
      description: sampleCopy,
      vendor: "Harbor Sample",
      categoryIds: ["cat_travel"],
      variants: [
        {
          id: "var_sail",
          title: "Default",
          sku: "HBR-PCL-001",
          price: "18.00",
          costOfGoods: "5.00",
          onHand: 22,
        },
      ],
      hue: 175,
      mediaLabel: "Pouch",
      updatedHoursAgo: 15,
    }),
    product({
      id: "prd_harbor_clock",
      title: "Sample Tide Clock",
      description: sampleCopy,
      vendor: "Harbor Sample",
      categoryIds: ["cat_decor"],
      variants: [
        {
          id: "var_clock",
          title: "Default",
          sku: "HBR-CLK-001",
          price: "42.00",
          costOfGoods: "16.00",
          onHand: 0,
        },
      ],
      hue: 230,
      mediaLabel: "Clock",
      updatedHoursAgo: 28,
    }),
  ];
}

function metrics(
  sessions: string,
  sales: string,
  orders: string,
  visitors: string,
  deltas: [number, number, number, number],
): Record<DashboardRange, Metric[]> {
  const build = (scale: number, deltaScale: number): Metric[] => [
    {
      key: "sessions",
      label: "Site sessions",
      value: sessions,
      deltaPercent: Number((deltas[0] * deltaScale).toFixed(1)),
      series: [8, 10, 9, 12, 11, 14, 16, 15, 18, 20].map((n) => Math.round(n * scale)),
    },
    {
      key: "sales",
      label: "Total sales",
      value: sales,
      deltaPercent: Number((deltas[1] * deltaScale).toFixed(1)),
      series: [6, 8, 7, 11, 10, 13, 12, 16, 18, 17].map((n) => Math.round(n * scale)),
    },
    {
      key: "orders",
      label: "Total orders",
      value: orders,
      deltaPercent: Number((deltas[2] * deltaScale).toFixed(1)),
      series: [4, 5, 5, 6, 7, 6, 8, 9, 8, 10].map((n) => Math.round(n * scale)),
    },
    {
      key: "visitors",
      label: "Unique visitors",
      value: visitors,
      deltaPercent: Number((deltas[3] * deltaScale).toFixed(1)),
      series: [7, 9, 8, 10, 12, 11, 13, 14, 16, 15].map((n) => Math.round(n * scale)),
    },
  ];
  return {
    today: build(1, 1),
    "7d": build(1.15, 0.7),
    "30d": build(1.3, 0.45),
  };
}

function categories(items: { id: string; name: string }[]): Category[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.name.toLowerCase().replaceAll(" ", "-"),
    productCount: 0,
  }));
}

export function createSeed(): TenantBucket[] {
  const daykodee: TenantBucket = {
    tenant: {
      id: "ten_daykodee",
      slug: "daykodee",
      name: "Daykodee",
      initials: "DK",
      accent: "oklch(0.205 0 0)",
      accentForeground: "oklch(0.985 0 0)",
    },
    settings: {
      storeName: "Daykodee Sample Shop",
      contactEmail: "hello@example.com",
      supportPhone: "+1 (555) 010-0199",
      addressLine: "100 Sample Street",
      city: "Example City",
      region: "CA",
      postalCode: "94000",
      timezone: "America/Los_Angeles",
      currency: "USD",
      status: "sample",
    },
    payments: {
      acceptCard: true,
      acceptManual: false,
      testMode: true,
      statementDescriptor: "DAYKODEE SAMPLE",
      payoutAccountLabel: "Sample payout account ••19",
    },
    categories: categories([
      { id: "cat_apparel", name: "Apparel" },
      { id: "cat_accessories", name: "Accessories" },
      { id: "cat_drinkware", name: "Drinkware" },
      { id: "cat_bags", name: "Bags" },
      { id: "cat_home", name: "Home" },
      { id: "cat_stationery", name: "Stationery" },
    ]),
    products: daykodeeProducts(),
    threads: [
      {
        id: "thr_fit",
        subject: "Question about the sample tote",
        preview: "Does the sample tote description mention a size?",
        fromName: "Sample Customer",
        unread: true,
        receivedAt: hoursBeforeSampleNow(1),
      },
      {
        id: "thr_stock",
        subject: "Notebook restock note",
        preview: "Sample message about notebook availability.",
        fromName: "Sample Buyer",
        unread: true,
        receivedAt: hoursBeforeSampleNow(6),
      },
      {
        id: "thr_done",
        subject: "Thanks for the sample reply",
        preview: "This thread is already read.",
        fromName: "Sample Customer",
        unread: false,
        receivedAt: hoursBeforeSampleNow(30),
      },
    ],
    activity: [
      {
        id: "act_1",
        title: "Sample order #1042 was placed",
        detail: "Sample Customer · Sample Tote Bag · $32.00",
        kind: "order",
        occurredAt: hoursBeforeSampleNow(0.2),
      },
      {
        id: "act_2",
        title: "Low inventory on Sample Patterned Socks",
        detail: "9 available across 5 variants",
        kind: "inventory",
        occurredAt: hoursBeforeSampleNow(3),
      },
      {
        id: "act_3",
        title: "Sample payout marked settled",
        detail: "No live payment provider is connected",
        kind: "payment",
        occurredAt: hoursBeforeSampleNow(8),
      },
      {
        id: "act_4",
        title: "Sample review on Sample Desk Notebook",
        detail: "Placeholder review text",
        kind: "review",
        occurredAt: hoursBeforeSampleNow(20),
      },
      {
        id: "act_5",
        title: "Sample automation sent a note",
        detail: "Triggered a sample message to 4 test inboxes",
        kind: "automation",
        occurredAt: hoursBeforeSampleNow(26),
      },
    ],
    metrics: metrics("48,290", "$12,480", "186", "9,420", [12.4, 8.1, 5.6, 3.2]),
    setup: { completed: 2, total: 8 },
  };

  const harbor: TenantBucket = {
    tenant: {
      id: "ten_harbor",
      slug: "harbor-sample",
      name: "Harbor Sample",
      initials: "HS",
      accent: "oklch(0.42 0.07 230)",
      accentForeground: "oklch(0.985 0 0)",
    },
    settings: {
      storeName: "Harbor Sample Goods",
      contactEmail: "harbor@example.com",
      supportPhone: "+1 (555) 010-0144",
      addressLine: "44 Sample Wharf",
      city: "Example Harbor",
      region: "WA",
      postalCode: "98100",
      timezone: "America/Los_Angeles",
      currency: "USD",
      status: "sample",
    },
    payments: {
      acceptCard: false,
      acceptManual: true,
      testMode: true,
      statementDescriptor: "HARBOR SAMPLE",
      payoutAccountLabel: null,
    },
    categories: categories([
      { id: "cat_outdoor", name: "Outdoor" },
      { id: "cat_decor", name: "Decor" },
      { id: "cat_travel", name: "Travel" },
    ]),
    products: harborProducts(),
    threads: [
      {
        id: "thr_harbor",
        subject: "Lantern sample question",
        preview: "Is the harbor lantern a sample listing?",
        fromName: "Sample Visitor",
        unread: true,
        receivedAt: hoursBeforeSampleNow(4),
      },
    ],
    activity: [
      {
        id: "act_h1",
        title: "Sample Harbor Lantern was updated",
        detail: "Price left at $36.00",
        kind: "inventory",
        occurredAt: hoursBeforeSampleNow(2),
      },
      {
        id: "act_h2",
        title: "Sample Tide Clock is out of stock",
        detail: "0 available",
        kind: "inventory",
        occurredAt: hoursBeforeSampleNow(12),
      },
    ],
    metrics: metrics("1,260", "$640", "14", "480", [4.2, -2.5, 1.1, 6.4]),
    setup: { completed: 1, total: 8 },
  };

  return [daykodee, harbor];
}
