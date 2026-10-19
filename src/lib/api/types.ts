/**
 * Hand-written types for the Loom admin API.
 * Keep in sync with openapi.yaml at the repository root.
 */

export type ProductType = "physical" | "digital" | "service";
export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";
export type OrderStatus = "open" | "paid" | "fulfilled" | "cancelled" | "refunded";
export type DashboardRange = "today" | "7d" | "30d";
export type ActivityKind = "order" | "inventory" | "payment" | "review" | "automation";
export type StoreStatus = "sample" | "live";

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Page<T> = {
  data: T[];
  page: PageMeta;
};

export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  tenantIds: string[];
};

export type Session = {
  user: SessionUser;
  expiresAt: string;
};

export type SignInRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type RegisteredUser = {
  id: string;
  name: string;
  email: string;
};

export type RegisterResult = {
  user: RegisteredUser;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  accent: string;
  accentForeground: string;
};

export type StoreSettings = {
  storeName: string;
  contactEmail: string;
  supportPhone: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  timezone: string;
  currency: string;
  status: StoreStatus;
};

export type PaymentsSettings = {
  acceptCard: boolean;
  acceptManual: boolean;
  testMode: boolean;
  statementDescriptor: string;
  payoutAccountLabel: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type CategoryWrite = {
  name: string;
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type OptionWrite = {
  name: string;
  values: string[];
};

export type VariantOptionValue = {
  name: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  costOfGoods: string | null;
  optionValues: VariantOptionValue[];
  onHand: number;
  reserved: number;
};

export type VariantWrite = {
  title: string;
  sku: string;
  price: string;
  compareAtPrice?: string | null;
  costOfGoods?: string | null;
  optionValues?: VariantOptionValue[];
  onHand?: number;
  reserved?: number;
};

export type VariantPatch = Partial<VariantWrite>;

export type ProductMedia = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

export type MediaWrite = {
  url: string;
  alt: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  productType: ProductType;
  vendor: string;
  tags: string[];
  primaryBadge: string | null;
  categoryIds: string[];
  showInOnlineStore: boolean;
  showInPointOfSale: boolean;
  scheduleAvailability: boolean;
  availableFrom: string | null;
  price: string;
  compareAtPrice: string | null;
  costOfGoods: string | null;
  currency: string;
  taxGroup: string | null;
  showPricePerUnit: boolean;
  unitPriceLabel: string | null;
  options: ProductOption[];
  variants: ProductVariant[];
  media: ProductMedia[];
  createdAt: string;
  updatedAt: string;
};

export type ProductWrite = {
  title: string;
  description?: string;
  productType?: ProductType;
  vendor?: string;
  tags?: string[];
  primaryBadge?: string | null;
  categoryIds?: string[];
  showInOnlineStore?: boolean;
  showInPointOfSale?: boolean;
  scheduleAvailability?: boolean;
  availableFrom?: string | null;
  price: string;
  compareAtPrice?: string | null;
  costOfGoods?: string | null;
  taxGroup?: string | null;
  showPricePerUnit?: boolean;
  unitPriceLabel?: string | null;
  media?: MediaWrite[];
};

export type ProductPatch = Partial<ProductWrite>;

export type ProductListItem = {
  id: string;
  title: string;
  productType: ProductType;
  vendor: string;
  sku: string | null;
  price: string;
  currency: string;
  variantCount: number;
  inventoryStatus: InventoryStatus;
  available: number;
  categoryNames: string[];
  thumbnailUrl: string | null;
  updatedAt: string;
};

export type ProductListQuery = {
  q?: string;
  productType?: ProductType | "";
  inventoryStatus?: InventoryStatus | "";
  categoryId?: string;
  page?: number;
  pageSize?: number;
  sort?: "title" | "updatedAt";
};

export type InventoryItem = {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  status: InventoryStatus;
};

export type InventoryPatch = {
  onHand: number;
};

export type OrderLine = {
  title: string;
  quantity: number;
  unitPrice: string;
};

export type Order = {
  id: string;
  number: string;
  customerName: string;
  total: string;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  lineItems: OrderLine[];
};

export type InboxThread = {
  id: string;
  subject: string;
  preview: string;
  fromName: string;
  unread: boolean;
  receivedAt: string;
};

export type InboxList = {
  data: InboxThread[];
  unreadCount: number;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  kind: ActivityKind;
  occurredAt: string;
};

export type Metric = {
  key: string;
  label: string;
  value: string;
  deltaPercent: number;
  series: number[];
};

export type DashboardOverview = {
  range: DashboardRange;
  setup: { completed: number; total: number };
  store: {
    name: string;
    status: StoreStatus;
    addressLine: string;
    contactEmail: string;
    supportPhone: string;
  };
  metrics: Metric[];
  activity: ActivityItem[];
};
