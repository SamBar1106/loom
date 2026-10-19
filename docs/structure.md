# Loom frontend structure

Loom is a Vite single-page app. Tenant data is not stored in the browser except for edits made during the session against the in-memory mock.

```
openapi.yaml                 HTTP contract
docs/api-contract.md         How to read the contract
docs/structure.md            This file
docs/screenshots/            Playwright captures at 1024 and 1280
e2e/admin.spec.ts            Screenshot and interaction checks
src/main.tsx                 Router, React Query, tooltip, toasts
src/app/app.tsx              Route table under /t/:tenantSlug
src/app/tenant-context.tsx   Resolves the slug, applies accent CSS variables
src/lib/api/types.ts         Types kept in sync with openapi.yaml
src/lib/api/client.ts        fetch or mock, always sends X-Tenant-Id
src/lib/api/hooks.ts         React Query hooks, keys include tenant id
src/lib/api/mock/seed.ts     Fictional catalogs for two tenants
src/lib/api/mock/dispatch.ts Path router that implements the contract
src/components/ui/           shadcn/ui components
src/components/layout/       Sidebar, header, shell
src/pages/                   Home, products, edit, inventory, categories,
                             orders, inbox, settings, payments
```

## Routes

| Path | Screen |
| --- | --- |
| `/` | Redirects to `/t/daykodee` |
| `/t/:tenantSlug` | Home overview |
| `/t/:tenantSlug/orders` | Orders, empty in the sample data |
| `/t/:tenantSlug/products` | Searchable product table |
| `/t/:tenantSlug/products/new` | Create product |
| `/t/:tenantSlug/products/:productId` | Edit product |
| `/t/:tenantSlug/inventory` | Variant stock |
| `/t/:tenantSlug/categories` | Categories |
| `/t/:tenantSlug/inbox` | Messages |
| `/t/:tenantSlug/settings` | Store settings |
| `/t/:tenantSlug/settings/payments` | Accept payments |

The sidebar groups Inventory and Categories under Products, and Store settings and Accept payments under Settings.

## Tenants

`TenantLayout` loads the session and the tenant list, matches `:tenantSlug`, and writes the tenant accent onto `--primary`, `--primary-foreground`, `--sidebar-primary`, and `--ring`. Those variables are the only per-tenant color. The chrome stays neutral.

React Query keys start with the resource name and the tenant id, so a workspace switch cannot reuse another tenant's cached products.

The header switcher keeps the current section when the destination tenant can show it. A product edit URL is sent to the product list, because product ids are not shared across tenants.

## API client

`apiRequest` builds the query string and the `X-Tenant-Id` header. If `VITE_API_BASE_URL` is empty, `mockDispatch` returns a `Response`. If it is set, the same request is sent with `fetch` and `credentials: "include"`. Pages never import the mock database.

## Sample data

The first workspace slug is `daykodee`. Its store name is Daykodee Sample Shop and its products are named like Sample Tote Bag. `harbor-sample` is a second fictional workspace with a different accent and catalog. Nothing in the seed is a live catalog, a customer list, or a credential.

Relative times use a fixed clock in `src/lib/sample-clock.ts` (`2026-10-18T23:00:00.000Z`) so the overview does not drift between screenshots.
