# Loom API contract

The machine-readable contract is [`openapi.yaml`](../openapi.yaml) at the repository root. TypeScript types in `src/lib/api/types.ts` mirror those schemas. The in-memory mock in `src/lib/api/mock/dispatch.ts` implements the same paths, status codes, and error envelope.

The FastAPI backend is not part of this repository. Pointing the frontend at it is an environment change, not a code change.

## Base URL

| Setting | Behavior |
| --- | --- |
| `VITE_USE_MOCK=true` | Requests stay in the browser and are answered by the mock. |
| `VITE_API_BASE` empty, mock off | `fetch` calls this app's origin with `credentials: "include"`. |
| `VITE_API_BASE=http://127.0.0.1:8000`, mock off | `fetch` calls that origin with `credentials: "include"`. |

`VITE_API_BASE` defaults to empty. `VITE_API_BASE_URL` is the previous name and is used only when `VITE_API_BASE` is unset. Setting it does not enable the mock.

`.env.development` sets `VITE_USE_MOCK=true`, so `npm run dev` stays on the mock. `.env.production` sets `VITE_USE_MOCK=false`, so `npm run build` calls the live API. Playwright builds with `VITE_USE_MOCK=true` before serving the preview. A value already set in the shell overrides those files.

Paths are rooted at `/v1`. Example: `GET {base}/v1/products`. An empty base is a relative URL.

## Tenant scoping

UI routes look like `/t/daykodee/products`. The slug is not sent as the tenant id. The app loads `GET /v1/tenants`, finds the matching tenant, and sends its id on later calls.

```
X-Tenant-Id: ten_daykodee
```

That header is required for catalog, inventory, orders, inbox, dashboard, store settings, payment settings, and Stripe Connect. These routes do not use it:

- `GET`, `POST`, and `DELETE /v1/auth/session`
- `POST /v1/auth/register`
- `GET /v1/auth/google/start`
- `GET /v1/auth/google/callback`
- `GET /v1/tenants`
- `GET /v1/tenants/{tenantId}`
- `GET /v1/checkout/sessions/{sessionId}` (buyer receipt; `storeSlug` query, no cookie)
- `GET /v1/public/stores/{storeSlug}/products`
- `GET /v1/public/stores/{storeSlug}/products/{productId}`
- `POST /v1/public/checkout`

A missing header returns `400` with code `tenant_required`. An unknown id returns `404` with code `tenant_not_found`. A resource that exists for a different tenant returns `404` with code `not_found`, so one tenant cannot read another tenant's rows.

The sample workspace is `ten_daykodee` (`daykodee`). A second workspace, `ten_harbor` (`harbor-sample`), exists so the switcher and the isolated catalogs can be checked. Both catalogs are fictional.

## Auth

The session is the HttpOnly `loom_session` cookie. `fetch` sends `credentials: "include"`. The app does not write tokens to `localStorage`.

`GET /v1/auth/session` returns the current user and the tenant ids they can open. With no cookie it returns `401` `unauthenticated`.

`POST /v1/auth/session` signs in:

```json
{ "email": "alex.sample@example.com", "password": "sample-password" }
```

`200` returns a `Session` and sets `loom_session`. A wrong email or password returns `401` with message `Incorrect email or password.` Missing fields return `400` `validation_error`. Too many attempts return `429` `rate_limited`. The sign-in screen shows `Too many attempts, try again in a few minutes.`

`POST /v1/auth/register` creates an account and sets the `loom_session` cookie. The body is the new user, not a `Session`. After `201` the app calls `GET /v1/auth/session` and opens the store. There is no second sign-in.

```json
{ "name": "Alex Sample", "email": "alex.sample@example.com", "password": "sample-password" }
```

`name` is the full name, 1–120 characters. `password` is at least 8 characters. Confirm password is checked in the browser and is not sent.

| Status | Meaning |
| --- | --- |
| `201` | `{ "user": { "id", "name", "email" } }` and `Set-Cookie: loom_session`. |
| `403` | Registration is disabled. This is the default. The screen shows `Sign-up is invite-only for now` and a link back to sign in. |
| `409` | That email already has an account. Code `conflict`. |
| `422` | Validation failed. Code `validation_error`, with field details. |
| `429` | Too many attempts. The screen shows `Too many attempts, try again in a few minutes.` |

`DELETE /v1/auth/session` returns `204` and clears the cookie.

`GET /v1/auth/google/start` is a browser navigation, not a `fetch`. The live API responds with `302` to Google. `GET /v1/auth/google/callback` receives `code`, `state`, and an optional `error`. On success it sets `loom_session` and redirects the browser back into the app. The page never reads those query values.

The mock accepts `alex.sample@example.com` / `sample-password`, and any account created while invite-only is off. It cannot set an HttpOnly cookie. It keeps the signed-in name and email in `sessionStorage` under `loom.mock.session`, including after a register `201`, so a refresh stays signed in. That value is not a token and not a password. Other mock routes return `401` until that preview session exists. With the mock on, Continue with Google navigates to `/v1/auth/google/start` on this origin, and the preview signs in the sample user. A live build sends that navigation to `{VITE_API_BASE}/v1/auth/google/start`, which is the same origin when the base is empty.

Preview switches on the auth screens write `sessionStorage` key `loom.mock.flags`. `registerOpen` defaults to false, so create account returns `403`. Turning Invite-only off sets `registerOpen` to true. A `201` then writes the preview session. Rate limit defaults to off. Turning it on makes `POST /v1/auth/session` and `POST /v1/auth/register` return `429`. Rate limit is checked before the invite-only response.

## Lists and errors

List routes return:

```json
{
  "data": [],
  "page": { "page": 1, "pageSize": 8, "total": 16, "totalPages": 2 }
}
```

`page` starts at 1. `pageSize` is 1 through 100 and defaults to 8. `totalPages` is 0 when there are no rows. Inbox is not paginated; it returns `{ "data": [], "unreadCount": 0 }`.

Errors always use:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Check the highlighted fields.",
    "details": [{ "field": "title", "message": "Title is required." }]
  }
}
```

Codes: `unauthenticated`, `tenant_required`, `tenant_not_found`, `not_found`, `validation_error`, `conflict`, `forbidden`, `rate_limited`, `request_failed`.

Money fields are decimal strings with two fraction digits, such as `"32.00"`.

## Resources

| Area | Routes |
| --- | --- |
| Auth | `GET`, `POST`, and `DELETE /v1/auth/session`, `POST /v1/auth/register`, `GET /v1/auth/google/start`, `GET /v1/auth/google/callback` |
| Tenants | `GET /v1/tenants`, `GET /v1/tenants/{tenantId}` |
| Dashboard | `GET /v1/dashboard?range=today\|7d\|30d` |
| Products | `GET` and `POST /v1/products`, `GET`, `PATCH`, and `DELETE /v1/products/{productId}`, `POST /v1/products/{productId}/image` |
| Variants | `GET` and `POST /v1/products/{productId}/variants`, `PATCH` and `DELETE .../variants/{variantId}` |
| Options | `GET` and `POST /v1/products/{productId}/options`, `PATCH` and `DELETE .../options/{optionId}` |
| Inventory | `GET /v1/inventory`, `PATCH /v1/inventory/{variantId}` with `{ "onHand": 12 }` |
| Categories | `GET` and `POST /v1/categories`, `PATCH` and `DELETE /v1/categories/{categoryId}` |
| Orders | `GET /v1/orders`, `GET /v1/orders/{orderId}` |
| Checkout | `GET /v1/checkout/sessions/{sessionId}?storeSlug=` |
| Inbox | `GET /v1/inbox`, `PATCH /v1/inbox/{threadId}` with `{ "unread": false }` |
| Store settings | `GET` and `PATCH /v1/store-settings` |
| Payments | `GET` and `PATCH /v1/payments-settings` |
| Stripe | `GET /v1/stripe/account`, `POST /v1/stripe/accounts`, `POST /v1/stripe/onboarding-links`, `GET /v1/stripe/balance`, `GET /v1/stripe/payouts` |

Inventory status is derived. Available units are `onHand - reserved`. `0` is `out_of_stock`, `1` through `10` is `low_stock`, and anything higher is `in_stock`. Product list status uses the sum across that product's variants.

A product's `price` is the lowest variant price. Creating a product requires `title` and `price` and creates one default variant. Deleting the last variant returns `409 conflict`.

`POST /v1/products/{productId}/image` uploads one image. The body is `multipart/form-data` with a single field, `file`. The file must be `image/jpeg`, `image/png`, `image/webp`, or `image/gif`, and at most 5 MB. A missing file, an empty file, or another type returns `400` `validation_error` on field `file`. An unknown product returns `404` `not_found`. The response is the product, with the new media item appended (`id`, `url`, `alt`, `position`). `X-Tenant-Id` is required. The mock stores the bytes as a data URL so the editor can show the image in the same session.

Payment settings expose toggles, a statement descriptor, and an optional masked payout label. They do not accept secret keys, account numbers, or provider tokens.

## Stripe Connect

Accept payments uses the loom-api Stripe Connect routes (Accounts v2). The browser shows `chargesEnabled`, `payoutsEnabled`, and `detailsSubmitted`, then opens a Stripe-hosted onboarding URL. It never sends or stores a secret key.

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/v1/stripe/account` | Status for the tenant in `X-Tenant-Id`. `id` is null when Stripe is not connected. |
| `POST` | `/v1/stripe/accounts` | Creates the connected account. Idempotent: an existing account is returned unchanged. No request fields. |
| `POST` | `/v1/stripe/onboarding-links` | Returns `{ "url" }`. Optional `returnUrl` and `refreshUrl` are the pages Stripe should send the browser back to. |
| `GET` | `/v1/stripe/balance` | Available and pending amounts for the connected account. `404` `not_found` when Stripe is not connected. |
| `GET` | `/v1/stripe/payouts` | Recent payouts, newest first. Paginated like other lists. `404` `not_found` when Stripe is not connected. An account with no payouts is `200` and an empty page. |

`X-Tenant-Id` is the internal tenant id, such as `ten_daykodee`. A `404` with code `not_found` on `GET /v1/stripe/account` means there is no account yet. The same code on `GET /v1/stripe/balance` and `GET /v1/stripe/payouts` means there is no connected account. `tenant_not_found` means the tenant id is unknown. `POST /v1/stripe/onboarding-links` returns `409` when the tenant has no account.

The onboarding `url` is `http` or `https` and has no user or password. The page navigates the browser to it. Responses do not include secret keys, refresh tokens, or client secrets.

In the mock, Daykodee has no account, so the button is Connect with Stripe. Balance and payouts are `404` `not_found`, and the page shows No balance and No payouts. Harbor Sample already has `acct_sample_ten_harbor` with details submitted and charges still off, so the button is Continue onboarding. Harbor's balance is available `186.40` USD and pending `24.00` USD, with payouts `po_sample_h1` (`120.00`, paid) and `po_sample_h2` (`40.00`, in transit). The sample onboarding URL is on `connect.stripe.com` and is not a live account link.

## Stripe balance and payouts

`GET /v1/stripe/balance` and `GET /v1/stripe/payouts` use the same session cookie and `X-Tenant-Id` header as the other Stripe routes. loom-api does not implement them yet. The mock does. A live API should match this section.

Balance response:

```json
{
  "available": [{ "amount": "186.40", "currency": "USD" }],
  "pending": [{ "amount": "24.00", "currency": "USD" }]
}
```

`amount` is a decimal string with two fraction digits in major units. Stripe's minor units are converted before the response (`18640` cents is `"186.40"`). `currency` is an uppercase ISO code. One object per currency. Empty arrays mean that group has no amount. The body does not include secret keys or bank account numbers.

Payout list uses `page` (default 1) and `pageSize` (default 8, max 100). Newest `createdAt` first. A row is `id`, `amount`, `currency`, `status`, `arrivalDate`, and `createdAt`. `status` is `paid`, `pending`, `in_transit`, `canceled`, or `failed`. `arrivalDate` and `createdAt` are ISO-8601 timestamps. Destination bank details are omitted. An upstream Stripe failure is `request_failed`.

Creating a connected account in the mock sets available and pending to `0.00` USD and an empty payout list.

Orders require `X-Tenant-Id` with the internal tenant id. Status is `pending`, `paid`, or `failed`. Each order includes `items` (catalog `productId`, title, quantity, unit price), `amount`, `fee`, `buyerEmail`, and `createdAt`. The sample tenants return a few fictional orders so the Orders screen and the buyer receipt can be checked. One tenant cannot read another tenant's order.

`GET /v1/checkout/sessions/{sessionId}?storeSlug=` is public. The buyer page `/t/{storeSlug}/checkout/success?session_id=` calls it and shows the order summary. No session cookie and no `X-Tenant-Id`. A session that belongs to a different store is `404` `not_found`. The body has no card data and no secret keys. `/t/{storeSlug}/checkout/cancel` is a static page and does not call the API.

## Public store

Signed-out buyers open `/t/{storeSlug}` for the product list and `/t/{storeSlug}/p/{productId}` for one product. Signed-in admins still see the dashboard at `/t/{storeSlug}`.

`GET /v1/public/stores/{storeSlug}/products` returns `{ "store": { "slug", "name" }, "data": [] }`. A product is included when `showInOnlineStore` is true. `GET /v1/public/stores/{storeSlug}/products/{productId}` returns `{ "store", "product" }`. Hidden products and unknown stores are `404` `not_found`. Fields are id, title, description, price, currency, imageUrl, imageAlt, and available. Cost and tenant ids are omitted.

`POST /v1/public/checkout` is the only checkout call. The helper is `startPublicCheckout` in `src/lib/api/public-store.ts`, and the path constant is `publicCheckoutPath` (`/v1/public/checkout`). The body is `{ "storeSlug", "productId", "quantity" }`. `quantity` is an integer of 1 or more. The response is `{ "url" }`. The page navigates to that URL when it is `http` or `https` and has no user or password. Unknown stores and products are `404`. A quantity above available stock is `409` `conflict`. The mock URL is on `checkout.stripe.com` and includes `quantity` as a query parameter so tests can read it. The live API returns the Stripe Checkout URL.
