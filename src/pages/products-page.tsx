import { Link, useSearchParams } from "react-router-dom";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategories, useProducts } from "@/lib/api/hooks";
import type { InventoryStatus, ProductType } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { inventoryLabel, inventoryStatus } from "@/lib/inventory";
import { tenantPath } from "@/lib/paths";
import { usePageTitle } from "@/pages/use-page-title";
import { useMemo, useState } from "react";

const typeOptions: { value: "all" | ProductType; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "service", label: "Service" },
];

const stockOptions: { value: "all" | InventoryStatus; label: string }[] = [
  { value: "all", label: "All stock" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

function stockVariant(status: InventoryStatus): "positive" | "warning" | "destructive" {
  switch (status) {
    case "in_stock":
      return "positive";
    case "low_stock":
      return "warning";
    case "out_of_stock":
      return "destructive";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function ProductsPage() {
  const { tenant } = useTenant();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<string[]>([]);
  usePageTitle("Products");

  const q = params.get("q") ?? "";
  const productType = params.get("productType") ?? "all";
  const inventory = params.get("inventoryStatus") ?? "all";
  const categoryId = params.get("categoryId") ?? "all";
  const page = Number(params.get("page") ?? "1") || 1;
  const categories = useCategories(tenant.id);
  const products = useProducts(tenant.id, {
    q,
    productType: productType === "all" ? "" : (productType as ProductType),
    inventoryStatus: inventory === "all" ? "" : (inventory as InventoryStatus),
    categoryId: categoryId === "all" ? "" : categoryId,
    page,
    pageSize: 8,
    sort: "updatedAt",
  });

  const pageIds = useMemo(() => products.data?.data.map((item) => item.id) ?? [], [products.data]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  function update(next: Record<string, string | null>, resetPage = true) {
    const copy = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all") copy.delete(key);
      else copy.set(key, value);
    }
    if (resetPage) copy.delete("page");
    setSelected([]);
    setParams(copy);
  }

  const meta = products.data?.page;
  const start = meta && meta.total > 0 ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const end = meta ? Math.min(meta.page * meta.pageSize, meta.total) : 0;

  return (
    <div className="flex flex-col gap-4" data-page="products">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Products</h1>
          <Badge variant="secondary">{meta?.total ?? "–"}</Badge>
        </div>
        <Button render={<Link to={tenantPath(tenant.slug, "products/new")} />} nativeButton={false}>
          <PlusIcon data-icon="inline-start" />
          New product
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <InputGroup className="lg:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search products"
            placeholder="Search products"
            value={q}
            onChange={(event) => update({ q: event.target.value })}
          />
        </InputGroup>
        <Select
          value={productType}
          onValueChange={(value) => update({ productType: value })}
        >
          <SelectTrigger className="w-full lg:w-40" aria-label="Product type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={inventory} onValueChange={(value) => update({ inventoryStatus: value })}>
          <SelectTrigger className="w-full lg:w-44" aria-label="Inventory status">
            <SelectValue placeholder="Inventory" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {stockOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={(value) => update({ categoryId: value })}>
          <SelectTrigger className="w-full lg:w-44" aria-label="Category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All categories</SelectItem>
              {(categories.data?.data ?? []).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {selected.length > 0 ? (
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-muted px-3">
          <p className="text-sm">{selected.length} selected</p>
          <Button variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      ) : null}

      {products.isLoading ? <PageSkeleton /> : null}
      {products.error ? <QueryError error={products.error} /> : null}

      {products.data ? (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    aria-label="Select all products on this page"
                    checked={allSelected}
                    onCheckedChange={(checked) => setSelected(checked ? pageIds : [])}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No products match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                products.data.data.map((item) => {
                  const status = inventoryStatus(item.available);
                  return (
                    <TableRow key={item.id} className="min-h-14">
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${item.title}`}
                          checked={selected.includes(item.id)}
                          onCheckedChange={(checked) =>
                            setSelected((current) =>
                              checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          to={tenantPath(tenant.slug, `products/${item.id}`)}
                          className="flex min-h-11 items-center gap-3"
                        >
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt=""
                              className="size-12 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="size-12 rounded-lg bg-muted" />
                          )}
                          <span>
                            <span className="block font-medium">{item.title}</span>
                            <span className="block text-xs text-muted-foreground">
                              {item.variantCount} {item.variantCount === 1 ? "variant" : "variants"}
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize">{item.productType}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{formatMoney(item.price, item.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={stockVariant(status)}>{inventoryLabel(status, item.available)}</Badge>
                      </TableCell>
                      <TableCell>{item.categoryNames.join(", ") || "—"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {start}–{end} of {meta?.total ?? 0}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!meta || meta.page <= 1}
                onClick={() => update({ page: String(page - 1) }, false)}
              >
                Previous
              </Button>
              {Array.from({ length: meta?.totalPages ?? 0 }, (_, index) => index + 1).map((number) => (
                <Button
                  key={number}
                  variant={number === page ? "default" : "outline"}
                  className="min-w-11"
                  onClick={() => update({ page: String(number) }, false)}
                  aria-current={number === page ? "page" : undefined}
                >
                  {number}
                </Button>
              ))}
              <Button
                variant="outline"
                disabled={!meta || meta.totalPages === 0 || meta.page >= meta.totalPages}
                onClick={() => update({ page: String(page + 1) }, false)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
