import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BoldIcon, ImagePlusIcon, ItalicIcon, ListIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiRequest } from "@/lib/api/client";
import { useCategories, useDeleteProduct, useProduct } from "@/lib/api/hooks";
import type { Product, ProductPatch, ProductType } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { tenantPath } from "@/lib/paths";
import { usePageTitle } from "@/pages/use-page-title";

type VariantDraft = {
  id: string;
  title: string;
  sku: string;
  price: string;
  onHand: number;
};

type Draft = {
  title: string;
  description: string;
  productType: ProductType;
  vendor: string;
  tags: string[];
  tagInput: string;
  primaryBadge: string;
  categoryIds: string[];
  showInOnlineStore: boolean;
  showInPointOfSale: boolean;
  scheduleAvailability: boolean;
  availableFrom: string;
  price: string;
  compareAtPrice: string;
  costOfGoods: string;
  taxGroup: string;
  showPricePerUnit: boolean;
  unitPriceLabel: string;
  sku: string;
  media: { url: string; alt: string }[];
  mediaUrl: string;
  variants: VariantDraft[];
};

const emptyDraft: Draft = {
  title: "",
  description: "",
  productType: "physical",
  vendor: "",
  tags: [],
  tagInput: "",
  primaryBadge: "",
  categoryIds: [],
  showInOnlineStore: true,
  showInPointOfSale: false,
  scheduleAvailability: false,
  availableFrom: "",
  price: "",
  compareAtPrice: "",
  costOfGoods: "",
  taxGroup: "Standard",
  showPricePerUnit: false,
  unitPriceLabel: "",
  sku: "",
  media: [],
  mediaUrl: "",
  variants: [],
};

function fromProduct(product: Product): Draft {
  const primary = product.variants[0];
  return {
    title: product.title,
    description: product.description,
    productType: product.productType,
    vendor: product.vendor,
    tags: product.tags,
    tagInput: "",
    primaryBadge: product.primaryBadge ?? "",
    categoryIds: product.categoryIds,
    showInOnlineStore: product.showInOnlineStore,
    showInPointOfSale: product.showInPointOfSale,
    scheduleAvailability: product.scheduleAvailability,
    availableFrom: product.availableFrom ?? "",
    price: product.variants.length === 1 ? (primary?.price ?? product.price) : product.price,
    compareAtPrice: primary?.compareAtPrice ?? "",
    costOfGoods: primary?.costOfGoods ?? "",
    taxGroup: product.taxGroup ?? "",
    showPricePerUnit: product.showPricePerUnit,
    unitPriceLabel: product.unitPriceLabel ?? "",
    sku: primary?.sku ?? "",
    media: product.media.map((item) => ({ url: item.url, alt: item.alt })),
    mediaUrl: "",
    variants: product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: variant.price,
      onHand: variant.onHand,
    })),
  };
}

function normalizeMoney(value: string): string {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return `${trimmed}.00`;
  if (/^\d+\.\d$/.test(trimmed)) return `${trimmed}0`;
  return trimmed;
}

function moneyToNumber(value: string): number | null {
  const normalized = normalizeMoney(value);
  if (!/^\d+\.\d{2}$/.test(normalized)) return null;
  return Number(normalized);
}

function snapshot(draft: Draft): string {
  return JSON.stringify(draft);
}

function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
): { value: string; cursor: number } {
  const selected = value.slice(selectionStart, selectionEnd) || "text";
  const next = `${value.slice(0, selectionStart)}${before}${selected}${after}${value.slice(selectionEnd)}`;
  return { value: next, cursor: selectionStart + before.length + selected.length + after.length };
}

function ProductEditor({
  creating,
  initial,
  productId,
}: {
  creating: boolean;
  initial: Draft;
  productId?: string;
}) {
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useCategories(tenant.id);
  const removeProduct = useDeleteProduct(tenant.id);
  const [draft, setDraft] = useState<Draft>(initial);
  const [baseline, setBaseline] = useState(() => snapshot(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  usePageTitle(creating ? "New product" : draft.title || "Edit product");

  const dirty = snapshot(draft) !== baseline;
  const multiple = draft.variants.length > 1;
  const priceNumber = moneyToNumber(draft.price);
  const costNumber = moneyToNumber(draft.costOfGoods);
  const profit = priceNumber !== null && costNumber !== null ? priceNumber - costNumber : null;
  const margin = profit !== null && priceNumber ? (profit / priceNumber) * 100 : null;

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyMarkup(before: string, after: string) {
    const element = descriptionRef.current;
    const start = element?.selectionStart ?? draft.description.length;
    const end = element?.selectionEnd ?? draft.description.length;
    const next = wrapSelection(draft.description, start, end, before, after);
    update("description", next.value);
  }

  async function save() {
    const errors: Record<string, string> = {};
    if (!draft.title.trim()) errors.title = "Title is required.";
    if (draft.title.length > 150) errors.title = "Use 150 characters or fewer.";
    const price = normalizeMoney(draft.price);
    if (!multiple && !/^\d+\.\d{2}$/.test(price)) errors.price = "Enter a price like 32.00.";
    if (!multiple && draft.compareAtPrice && !/^\d+\.\d{2}$/.test(normalizeMoney(draft.compareAtPrice))) {
      errors.compareAtPrice = "Enter a compare-at price like 40.00.";
    }
    if (!multiple && draft.costOfGoods && !/^\d+\.\d{2}$/.test(normalizeMoney(draft.costOfGoods))) {
      errors.costOfGoods = "Enter a cost like 12.00.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const body: ProductPatch = {
      title: draft.title.trim(),
      description: draft.description,
      productType: draft.productType,
      vendor: draft.vendor,
      tags: draft.tags,
      primaryBadge: draft.primaryBadge.trim() || null,
      categoryIds: draft.categoryIds,
      showInOnlineStore: draft.showInOnlineStore,
      showInPointOfSale: draft.showInPointOfSale,
      scheduleAvailability: draft.scheduleAvailability,
      availableFrom: draft.scheduleAvailability && draft.availableFrom ? draft.availableFrom : null,
      taxGroup: draft.taxGroup || null,
      showPricePerUnit: draft.showPricePerUnit,
      unitPriceLabel: draft.unitPriceLabel.trim() || null,
      media: draft.media,
    };
    if (!multiple) {
      body.price = price;
      body.compareAtPrice = draft.compareAtPrice ? normalizeMoney(draft.compareAtPrice) : null;
      body.costOfGoods = draft.costOfGoods ? normalizeMoney(draft.costOfGoods) : null;
    }

    setSaving(true);
    try {
      if (creating) {
        const created = await apiRequest<Product>("/v1/products", { method: "POST", tenantId: tenant.id, body });
        const variant = created.variants[0];
        if (variant) {
          await apiRequest(`/v1/products/${created.id}/variants/${variant.id}`, {
            method: "PATCH",
            tenantId: tenant.id,
            body: { sku: draft.sku || variant.sku, price, onHand: variant.onHand },
          });
        }
        await queryClient.invalidateQueries({ queryKey: ["products", tenant.id] });
        toast.success("Product created.");
        navigate(tenantPath(tenant.slug, `products/${created.id}`));
        return;
      }

      await apiRequest(`/v1/products/${productId}`, { method: "PATCH", tenantId: tenant.id, body });
      for (const variant of draft.variants) {
        await apiRequest(`/v1/products/${productId}/variants/${variant.id}`, {
          method: "PATCH",
          tenantId: tenant.id,
          body: multiple
            ? { sku: variant.sku, price: normalizeMoney(variant.price), onHand: variant.onHand }
            : {
                sku: draft.sku || variant.sku,
                price,
                compareAtPrice: draft.compareAtPrice ? normalizeMoney(draft.compareAtPrice) : null,
                costOfGoods: draft.costOfGoods ? normalizeMoney(draft.costOfGoods) : null,
                onHand: variant.onHand,
              },
        });
      }
      const fresh = await apiRequest<Product>(`/v1/products/${productId}`, { tenantId: tenant.id });
      queryClient.setQueryData(["product", tenant.id, productId], fresh);
      await queryClient.invalidateQueries({ queryKey: ["products", tenant.id] });
      await queryClient.invalidateQueries({ queryKey: ["inventory", tenant.id] });
      const next = fromProduct(fresh);
      setDraft(next);
      setBaseline(snapshot(next));
      toast.success("Product saved.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not save this product.";
      if (error instanceof ApiError) {
        const nextErrors: Record<string, string> = {};
        for (const detail of error.details) {
          if (detail.field) nextErrors[detail.field] = detail.message;
        }
        setFieldErrors(nextErrors);
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    const parsed = JSON.parse(baseline) as Draft;
    setDraft(parsed);
    setFieldErrors({});
  }

  return (
    <div className="flex flex-col gap-4" data-page="product-edit">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={tenantPath(tenant.slug, "products")} />}>Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{creating ? "New product" : draft.title || "Product"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {creating ? "New product" : draft.title || "Untitled product"}
          </h1>
          <Badge variant="outline" className="capitalize">
            {draft.productType} product
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? <span className="text-sm text-muted-foreground">Unsaved changes</span> : null}
          <Button variant="outline" onClick={discard} disabled={!dirty || saving}>
            Discard
          </Button>
          <Button onClick={() => void save()} disabled={saving || (!dirty && !creating)}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic info</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={fieldErrors.title ? true : undefined}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor="title">Title</FieldLabel>
                    <span className="text-xs text-muted-foreground">{draft.title.length}/150</span>
                  </div>
                  <Input
                    id="title"
                    value={draft.title}
                    aria-invalid={Boolean(fieldErrors.title)}
                    onChange={(event) => update("title", event.target.value)}
                  />
                  <FieldError>{fieldErrors.title}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="icon" aria-label="Bold" onClick={() => applyMarkup("**", "**")}>
                      <BoldIcon />
                    </Button>
                    <Button type="button" variant="outline" size="icon" aria-label="Italic" onClick={() => applyMarkup("_", "_")}>
                      <ItalicIcon />
                    </Button>
                    <Button type="button" variant="outline" size="icon" aria-label="List" onClick={() => applyMarkup("\n- ", "")}>
                      <ListIcon />
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    ref={descriptionRef}
                    className="min-h-40"
                    value={draft.description}
                    onChange={(event) => update("description", event.target.value)}
                  />
                  <FieldDescription>Formatting is stored as plain text.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Pricing</CardTitle>
                {profit !== null && margin !== null && !multiple ? (
                  <div className="flex gap-3 text-sm">
                    <span className="text-positive">Profit {formatMoney(profit.toFixed(2))}</span>
                    <span className="text-positive">Margin {margin.toFixed(1)}%</span>
                  </div>
                ) : null}
              </div>
              {multiple ? (
                <CardDescription>This product has several variants. Set price and stock on each row.</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              {multiple ? (
                <div className="flex flex-col gap-3">
                  {draft.variants.map((variant, index) => (
                    <div key={variant.id} className="grid gap-2 md:grid-cols-[1fr_1fr_8rem_6rem] md:items-end">
                      <Field>
                        <FieldLabel htmlFor={`variant-title-${variant.id}`}>{variant.title}</FieldLabel>
                        <Input id={`variant-title-${variant.id}`} value={variant.sku} aria-label={`${variant.title} SKU`} onChange={(event) => {
                          const variants = draft.variants.slice();
                          const current = variants[index];
                          if (!current) return;
                          variants[index] = { ...current, sku: event.target.value };
                          update("variants", variants);
                        }} />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`variant-price-${variant.id}`}>Price</FieldLabel>
                        <Input id={`variant-price-${variant.id}`} inputMode="decimal" value={variant.price} onChange={(event) => {
                          const variants = draft.variants.slice();
                          const current = variants[index];
                          if (!current) return;
                          variants[index] = { ...current, price: event.target.value };
                          update("variants", variants);
                        }} />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`variant-stock-${variant.id}`}>On hand</FieldLabel>
                        <Input id={`variant-stock-${variant.id}`} inputMode="numeric" value={String(variant.onHand)} onChange={(event) => {
                          const variants = draft.variants.slice();
                          const current = variants[index];
                          if (!current) return;
                          variants[index] = { ...current, onHand: Number(event.target.value) || 0 };
                          update("variants", variants);
                        }} />
                      </Field>
                    </div>
                  ))}
                </div>
              ) : (
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field data-invalid={fieldErrors.price ? true : undefined}>
                      <FieldLabel htmlFor="price">Price</FieldLabel>
                      <Input id="price" inputMode="decimal" value={draft.price} aria-invalid={Boolean(fieldErrors.price)} onChange={(event) => update("price", event.target.value)} />
                      <FieldError>{fieldErrors.price}</FieldError>
                    </Field>
                    <Field data-invalid={fieldErrors.compareAtPrice ? true : undefined}>
                      <FieldLabel htmlFor="compare">Compare at</FieldLabel>
                      <Input id="compare" inputMode="decimal" value={draft.compareAtPrice} aria-invalid={Boolean(fieldErrors.compareAtPrice)} onChange={(event) => update("compareAtPrice", event.target.value)} />
                      <FieldError>{fieldErrors.compareAtPrice}</FieldError>
                    </Field>
                    <Field data-invalid={fieldErrors.costOfGoods ? true : undefined}>
                      <FieldLabel htmlFor="cost">Cost of goods</FieldLabel>
                      <Input id="cost" inputMode="decimal" value={draft.costOfGoods} aria-invalid={Boolean(fieldErrors.costOfGoods)} onChange={(event) => update("costOfGoods", event.target.value)} />
                      <FieldError>{fieldErrors.costOfGoods}</FieldError>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="sku">SKU</FieldLabel>
                    <Input id="sku" value={draft.sku} onChange={(event) => update("sku", event.target.value)} />
                  </Field>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="unit-price">Show price per unit</FieldLabel>
                    <Switch id="unit-price" checked={draft.showPricePerUnit} onCheckedChange={(checked) => update("showPricePerUnit", checked)} />
                  </Field>
                  {draft.showPricePerUnit ? (
                    <Field>
                      <FieldLabel htmlFor="unit-label">Unit label</FieldLabel>
                      <Input id="unit-label" value={draft.unitPriceLabel} placeholder="per 100 g" onChange={(event) => update("unitPriceLabel", event.target.value)} />
                    </Field>
                  ) : null}
                  <Field>
                    <FieldLabel>Product tax group</FieldLabel>
                    <Select value={draft.taxGroup || "none"} onValueChange={(value) => update("taxGroup", value === "none" ? "" : (value ?? ""))}>
                      <SelectTrigger className="w-full" aria-label="Product tax group">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Reduced">Reduced</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Files stay in this browser session.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {draft.media.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="relative">
                    <img src={item.url} alt={item.alt} className="aspect-4/3 w-full rounded-lg object-cover" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-sm"
                      className="absolute top-2 right-2"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => update("media", draft.media.filter((_, mediaIndex) => mediaIndex !== index))}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
                  <ImagePlusIcon />
                  Drop a file or browse
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        update("media", [...draft.media, { url: String(reader.result), alt: file.name }]);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  aria-label="Image URL"
                  placeholder="https://example.com/image.png"
                  value={draft.mediaUrl}
                  onChange={(event) => update("mediaUrl", event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!draft.mediaUrl.trim()) return;
                    update("media", [...draft.media, { url: draft.mediaUrl.trim(), alt: draft.title || "Product image" }]);
                    update("mediaUrl", "");
                  }}
                >
                  Add from URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="online">Show in online store</FieldLabel>
                  <Switch id="online" checked={draft.showInOnlineStore} onCheckedChange={(checked) => update("showInOnlineStore", checked)} />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="pos">Show in point of sale</FieldLabel>
                  <Switch id="pos" checked={draft.showInPointOfSale} onCheckedChange={(checked) => update("showInPointOfSale", checked)} />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="schedule">Schedule availability</FieldLabel>
                  <Switch id="schedule" checked={draft.scheduleAvailability} onCheckedChange={(checked) => update("scheduleAvailability", checked)} />
                </Field>
                {draft.scheduleAvailability ? (
                  <Field>
                    <FieldLabel htmlFor="available-from">Available from</FieldLabel>
                    <Input id="available-from" type="date" value={draft.availableFrom} onChange={(event) => update("availableFrom", event.target.value)} />
                  </Field>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {(categories.data?.data ?? []).map((category) => {
                const checked = draft.categoryIds.includes(category.id);
                return (
                  <Field key={category.id} orientation="horizontal">
                    <FieldLabel htmlFor={`cat-${category.id}`}>{category.name}</FieldLabel>
                    <Switch
                      id={`cat-${category.id}`}
                      checked={checked}
                      onCheckedChange={(next) =>
                        update(
                          "categoryIds",
                          next ? [...draft.categoryIds, category.id] : draft.categoryIds.filter((id) => id !== category.id),
                        )
                      }
                    />
                  </Field>
                );
              })}
              <Button variant="link" className="justify-start px-0" render={<Link to={tenantPath(tenant.slug, "categories")} />} nativeButton={false}>
                Manage categories
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Labels</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="badge">Primary badge</FieldLabel>
                  <Input id="badge" value={draft.primaryBadge} onChange={(event) => update("primaryBadge", event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tag">Collection tags</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="tag"
                      value={draft.tagInput}
                      onChange={(event) => update("tagInput", event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        const next = draft.tagInput.trim();
                        if (!next || draft.tags.includes(next)) return;
                        update("tags", [...draft.tags, next]);
                        update("tagInput", "");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const next = draft.tagInput.trim();
                        if (!next || draft.tags.includes(next)) return;
                        setDraft((current) => ({ ...current, tags: [...current.tags, next], tagInput: "" }));
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.tags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="secondary"
                        onClick={() => update("tags", draft.tags.filter((item) => item !== tag))}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="vendor">Brand / vendor</FieldLabel>
                  <Input id="vendor" value={draft.vendor} onChange={(event) => update("vendor", event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Product type</FieldLabel>
                  <Select
                    value={draft.productType}
                    onValueChange={(value) => {
                      if (value === "physical" || value === "digital" || value === "service") update("productType", value);
                    }}
                  >
                    <SelectTrigger className="w-full" aria-label="Product type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {!creating ? (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              Delete product
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>This product is removed from this store.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeProduct.isPending}
              onClick={() => {
                if (!productId) return;
                removeProduct.mutate(productId, {
                  onSuccess: () => {
                    toast.success("Product deleted.");
                    navigate(tenantPath(tenant.slug, "products"));
                  },
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProductFormPage() {
  const { productId } = useParams();
  const creating = !productId;
  const { tenant } = useTenant();
  const productQuery = useProduct(tenant.id, creating ? undefined : productId);

  if (!creating && productQuery.isLoading) return <PageSkeleton />;
  if (!creating && productQuery.error) return <QueryError error={productQuery.error} />;
  if (!creating && !productQuery.data) return <QueryError error={new Error("Product was not found.")} />;

  const initial = productQuery.data ? fromProduct(productQuery.data) : emptyDraft;
  return <ProductEditor key={productId ?? "new"} creating={creating} initial={initial} productId={productId} />;
}
