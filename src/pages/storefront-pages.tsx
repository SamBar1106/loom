import { useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, resolveMediaUrl } from "@/lib/api/client";
import { usePublicCatalog, usePublicCheckout, usePublicProduct } from "@/lib/api/hooks";
import type { PublicProduct, PublicStore } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { tenantPath } from "@/lib/paths";
import { isHttpUrl } from "@/lib/stripe-connect";
import { usePageTitle } from "@/pages/use-page-title";

function StoreFrame({
  page,
  title,
  children,
}: {
  page: string;
  title: string;
  children: ReactNode;
}) {
  usePageTitle(title);
  return (
    <main data-page={page} className="min-h-svh bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">{children}</div>
    </main>
  );
}

function NotFound({ title }: { title: string }) {
  return (
    <Empty className="min-h-60">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function StorefrontPage() {
  const { tenantSlug = "" } = useParams();
  const [params] = useSearchParams();
  const catalog = usePublicCatalog(tenantSlug);
  const missing = isNotFound(catalog.error);
  const title = missing ? "Store not found" : (catalog.data?.store.name ?? "Store");
  const preview = params.get("view") === "shop";

  return (
    <StoreFrame page="storefront" title={title}>
      <header className="flex flex-col gap-1">
        {preview ? (
          <Link to={tenantPath(tenantSlug)} className="text-sm">
            Admin
          </Link>
        ) : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {catalog.data ? <h2 className="text-sm text-muted-foreground">Products</h2> : null}
      </header>
      {catalog.isLoading ? <PageSkeleton /> : null}
      {catalog.error && !missing ? <QueryError error={catalog.error} /> : null}
      {catalog.data && catalog.data.data.length === 0 ? <NotFound title="No products" /> : null}
      {catalog.data && catalog.data.data.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.data.data.map((product) => (
            <li key={product.id}>
              <ProductCard storeSlug={tenantSlug} product={product} />
            </li>
          ))}
        </ul>
      ) : null}
    </StoreFrame>
  );
}

function ProductCard({ storeSlug, product }: { storeSlug: string; product: PublicProduct }) {
  return (
    <Card className="h-full">
      <CardHeader>
        {product.imageUrl ? (
          <img
            src={resolveMediaUrl(product.imageUrl)}
            alt={product.imageAlt ?? product.title}
            className="aspect-4/3 w-full rounded-lg object-cover"
          />
        ) : null}
        <CardTitle className="text-base">
          <Link to={`/t/${storeSlug}/p/${product.id}`}>{product.title}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{formatMoney(product.price, product.currency)}</p>
      </CardContent>
    </Card>
  );
}

export function StoreProductPage() {
  const { tenantSlug = "", productId = "" } = useParams();
  const productQuery = usePublicProduct(tenantSlug, productId);
  const product = productQuery.data?.product;
  const missing = isNotFound(productQuery.error);
  const title = missing ? "Product not found" : (product?.title ?? "Product");

  return (
    <StoreFrame page="store-product" title={title}>
      <p>
        <Link className="text-sm text-muted-foreground underline-offset-4 hover:underline" to={`/t/${tenantSlug}`}>
          Products
        </Link>
      </p>
      {missing ? <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1> : null}
      {productQuery.isLoading ? <PageSkeleton /> : null}
      {productQuery.error && !missing ? <QueryError error={productQuery.error} /> : null}
      {product && productQuery.data ? (
        <ProductDetail store={productQuery.data.store} product={product} storeSlug={tenantSlug} />
      ) : null}
    </StoreFrame>
  );
}

function ProductDetail({
  store,
  product,
  storeSlug,
}: {
  store: PublicStore;
  product: PublicProduct;
  storeSlug: string;
}) {
  const checkout = usePublicCheckout();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const outOfStock = product.available < 1;

  async function buy() {
    setError("");
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Enter a quantity of 1 or more.");
      return;
    }
    try {
      const result = await checkout.mutateAsync({
        storeSlug,
        productId: product.id,
        quantity,
      });
      if (!isHttpUrl(result.url)) {
        setError("Checkout did not return a URL.");
        return;
      }
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof ApiError ? checkoutError.message : "Checkout failed.");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {product.imageUrl ? (
        <img
          src={resolveMediaUrl(product.imageUrl)}
          alt={product.imageAlt ?? product.title}
          className="aspect-4/3 w-full rounded-xl object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{store.name}</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{product.title}</h1>
        {product.description ? <p className="whitespace-pre-wrap">{product.description}</p> : null}
        <p>{formatMoney(product.price, product.currency)}</p>
        {outOfStock ? <p>Out of stock</p> : null}
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
          <Input
            id="quantity"
            type="number"
            min={1}
            inputMode="numeric"
            value={Number.isFinite(quantity) ? String(quantity) : ""}
            disabled={outOfStock || checkout.isPending}
            onChange={(event) => setQuantity(event.target.value === "" ? Number.NaN : Number(event.target.value))}
          />
          <FieldError>{error}</FieldError>
        </Field>
        <Button className="w-fit" disabled={outOfStock || checkout.isPending} onClick={() => void buy()}>
          Buy
        </Button>
      </div>
    </div>
  );
}
