# Loom frontend structure

Loom is a Vite single-page app. Tenant data is not stored in the browser except for edits made during the session against the in-memory mock. The mock also stores the signed-in sample name and email in `sessionStorage` so a refresh stays signed in. Passwords and tokens are not stored.

```
openapi.yaml                 HTTP contract
docs/api-contract.md         How to read the contract
docs/structure.md            This file
docs/screenshots/            Playwright captures at 1024 and 1280
e2e/admin.spec.ts            Screenshot and interaction checks
src/main.tsx                 Router, React Query, tooltip, toasts
src/app/app.tsx              Route table. Public auth routes, then a guard
src/app/require-auth.tsx     Sends signed-out visitors to /sign-in
src/app/tenant-context.tsx   Resolves the slug, applies accent CSS variables
src/lib/api/types.ts         Types kept in sync with openapi.yaml
src/lib/api/client.ts        fetch or mock, credentials include, X-Tenant-Id
src/lib/api/hooks.ts         React Query hooks, keys include tenant id
src/lib/api/sample-account.ts  Fake preview email and password
src/lib/api/mock/seed.ts     Fictional catalogs for two tenants
src/lib/preview-flags.ts     Preview switches for invite-only and rate limit
src/lib/api/mock/auth.ts     Session, register, and Google mock routes
src/lib/api/mock/dispatch.ts Path router that implements the contract
src/lib/api/public-store.ts  Public catalog paths and POST /v1/public/checkout
src/lib/api/product-image.ts Product image path and file checks
src/lib/onboarding.ts        First-run checklist derived from API data
src/lib/stripe-connect.ts    Stripe account status, balance, payouts, and onboarding handoff
src/components/ui/           shadcn/ui components
src/components/auth/         Sign-in card, password field, Google button
src/components/layout/       Sidebar, header, shell
src/pages/                   Sign-in, create account, home, products, edit,
                             inventory, categories, orders, order detail,
                             checkout result, inbox, settings, payments
```

## Routes

| Path | Screen |
| --- | --- |
| `/sign-in` | Email and password sign-in |
| `/sign-up` | Create account |
| `/forgot-password` | Placeholder. Reset is not available |
| `/v1/auth/google/start` | Preview handoff when no API origin is set |
| `/` | Redirects to `/t/daykodee` after sign-in |
| `/t/:tenantSlug` | Public product list when signed out. Home overview when signed in |
| `/t/:tenantSlug/p/:productId` | Public product page. Buy calls `POST /v1/public/checkout` |
| `/t/:tenantSlug/orders` | Orders for the signed-in tenant |
| `/t/:tenantSlug/orders/:orderId` | Order detail from `GET /v1/orders/{orderId}` |
| `/t/:tenantSlug/checkout/success` | Public buyer receipt. `session_id` loads the order summary |
| `/t/:tenantSlug/checkout/cancel` | Public page shown when checkout is canceled |
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

`apiRequest` builds the query string and the `X-Tenant-Id` header. When `VITE_USE_MOCK` is `true` or `1`, `mockDispatch` returns a `Response`. Otherwise the same request is sent with `fetch` and `credentials: "include"` to `VITE_API_BASE`. An empty base is the same origin. `VITE_API_BASE_URL` is the previous name and applies only when `VITE_API_BASE` is unset. `.env.production` sets the mock flag off. Pages never import the mock database. Continue with Google assigns `window.location` to `{base}/v1/auth/google/start`. Accept payments reads `GET /v1/stripe/account`, `GET /v1/stripe/balance`, and `GET /v1/stripe/payouts`, and navigates to the URL from `POST /v1/stripe/onboarding-links`. Product image upload posts multipart field `file` to `POST /v1/products/{productId}/images` through `apiUpload`, which does not set `Content-Type` so the browser can add the multipart boundary. The product stores `url` as `/media/{name}`. `GET /media/{name}` returns the bytes.

The home checklist reads store settings, the product list total, the Stripe account id, and the public catalog. Dismissal is stored in `localStorage` under `loom.onboarding.dismissed` and is not an API field. `/t/{slug}?view=shop` shows the public store while signed in.

Signed-out visits to `/` redirect to `/sign-in`. Signed-out visits to `/t/:tenantSlug` show the public store. Admin sections under that slug still redirect to `/sign-in`. Checkout result pages and `/t/:tenantSlug/p/:productId` are outside the admin guard. A buyer can open them without an admin session. Dev and preview use SPA fallback and serve `index.html` for those paths, including a full reload of a production build. The header menu signs out with `DELETE /v1/auth/session`.

## Sample data

The first workspace slug is `daykodee`. Its store name is Daykodee Sample Shop and its products are named like Sample Tote Bag. `harbor-sample` is a second fictional workspace with a different accent and catalog. Nothing in the seed is a live catalog, a customer list, or a credential.

Relative times use a fixed clock in `src/lib/sample-clock.ts` (`2026-10-18T23:00:00.000Z`) so the overview does not drift between screenshots.
