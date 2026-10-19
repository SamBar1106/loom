# Loom API contract

The machine-readable contract is [`openapi.yaml`](../openapi.yaml) at the repository root. TypeScript types in `src/lib/api/types.ts` mirror those schemas. The in-memory mock in `src/lib/api/mock/dispatch.ts` implements the same paths, status codes, and error envelope.

The FastAPI backend is not part of this repository. Pointing the frontend at it is an environment change, not a code change.

## Base URL

| `VITE_API_BASE_URL` | Behavior |
| --- | --- |
| Unset | Requests stay in the browser and are answered by the mock. |
| `http://127.0.0.1:8000` | `fetch` calls that origin with `credentials: "include"`. |

Paths are rooted at `/v1`. Example: `GET {base}/v1/products`.

## Tenant scoping

UI routes look like `/t/daykodee/products`. The slug is not sent as the tenant id. The app loads `GET /v1/tenants`, finds the matching tenant, and sends its id on later calls.

```
X-Tenant-Id: ten_daykodee
```

That header is required for catalog, inventory, orders, inbox, dashboard, store settings, and payment settings. These routes do not use it:

- `GET`, `POST`, and `DELETE /v1/auth/session`
- `POST /v1/auth/register`
- `GET /v1/auth/google/start`
- `GET /v1/auth/google/callback`
- `GET /v1/tenants`
- `GET /v1/tenants/{tenantId}`

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

`POST /v1/auth/register` creates an account. It does not start a session.

```json
{ "name": "Alex Sample", "email": "alex.sample@example.com", "password": "sample-password" }
```

`name` is the full name, 1–120 characters. `password` is at least 8 characters. Confirm password is checked in the browser and is not sent.

| Status | Meaning |
| --- | --- |
| `201` | `{ "user": { "id", "name", "email" } }`. No `loom_session` cookie. |
| `403` | Registration is disabled. This is the default. The screen shows `Sign-up is invite-only for now` and a link back to sign in. |
| `409` | That email already has an account. Code `conflict`. |
| `422` | Validation failed. Code `validation_error`, with field details. |
| `429` | Too many attempts. The screen shows `Too many attempts, try again in a few minutes.` |

`DELETE /v1/auth/session` returns `204` and clears the cookie.

`GET /v1/auth/google/start` is a browser navigation, not a `fetch`. The live API responds with `302` to Google. `GET /v1/auth/google/callback` receives `code`, `state`, and an optional `error`. On success it sets `loom_session` and redirects the browser back into the app. The page never reads those query values.

The mock accepts only `alex.sample@example.com` / `sample-password`. It does not set a cookie. It keeps the signed-in name and email in `sessionStorage` under `loom.mock.session` so a refresh stays on the sample session. That value is not a token and not a password. Other mock routes return `401` until that preview session exists. With `VITE_API_BASE_URL` unset, Continue with Google navigates to `/v1/auth/google/start` on this origin, and the preview signs in the sample user. A configured API origin receives that navigation itself.

Preview switches on the auth screens write `sessionStorage` key `loom.mock.flags`. `registerOpen` defaults to false, so create account returns `403`. Turning Invite-only off sets `registerOpen` to true and allows `201`. Rate limit defaults to off. Turning it on makes `POST /v1/auth/session` and `POST /v1/auth/register` return `429`. Rate limit is checked before the invite-only response.

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
| Products | `GET` and `POST /v1/products`, `GET`, `PATCH`, and `DELETE /v1/products/{productId}` |
| Variants | `GET` and `POST /v1/products/{productId}/variants`, `PATCH` and `DELETE .../variants/{variantId}` |
| Options | `GET` and `POST /v1/products/{productId}/options`, `PATCH` and `DELETE .../options/{optionId}` |
| Inventory | `GET /v1/inventory`, `PATCH /v1/inventory/{variantId}` with `{ "onHand": 12 }` |
| Categories | `GET` and `POST /v1/categories`, `PATCH` and `DELETE /v1/categories/{categoryId}` |
| Orders | `GET /v1/orders`, `GET /v1/orders/{orderId}` |
| Inbox | `GET /v1/inbox`, `PATCH /v1/inbox/{threadId}` with `{ "unread": false }` |
| Store settings | `GET` and `PATCH /v1/store-settings` |
| Payments | `GET` and `PATCH /v1/payments-settings` |

Inventory status is derived. Available units are `onHand - reserved`. `0` is `out_of_stock`, `1` through `10` is `low_stock`, and anything higher is `in_stock`. Product list status uses the sum across that product's variants.

A product's `price` is the lowest variant price. Creating a product requires `title` and `price` and creates one default variant. Deleting the last variant returns `409 conflict`.

Payment settings expose toggles, a statement descriptor, and an optional masked payout label. They do not accept secret keys, account numbers, or provider tokens.

Orders are part of the contract and the sample tenants return an empty page, which the Orders screen renders as an empty state.
