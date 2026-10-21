# Loom

Loom is a multi-tenant store admin. This repository is the frontend: a React dashboard for products, inventory, orders, and store settings. The API is described in [`openapi.yaml`](openapi.yaml). The dev server answers it with an in-memory mock. A production build calls a live API on the same origin, or on `VITE_API_BASE`.

The sample workspace is **Daykodee** (`/t/daykodee`). A second workspace, **Harbor Sample**, is included so tenant switching and data isolation can be checked. Catalog copy, addresses, and emails are placeholders such as Sample Tote Bag and `hello@example.com`.

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Signed-out visitors land on `/sign-in`. The sample account is `alex.sample@example.com` / `sample-password`. After sign-in the app opens `/t/daykodee`. Create account is invite-only until the Preview switch Invite-only is turned off. Rate limit shows the too-many-attempts state for sign-in and create account.

```bash
npm run lint
npm run build
npm run preview
```

Screenshots at 1024 and 1280 pixels are generated with Playwright against the production preview:

```bash
npm run screenshots
```

Images are written to `docs/screenshots/`. Chrome on the machine is used, so a separate browser download is not required.

## API

The client calls `/v1` with `credentials: "include"` and sends `X-Tenant-Id` on tenant-owned routes. It does not store tokens in `localStorage`. Continue with Google navigates the browser to `{base}/v1/auth/google/start`. An empty base is this app's origin.

Buyer checkout results are public pages: `/t/<storeSlug>/checkout/success?session_id=` shows the order from `GET /v1/checkout/sessions/{sessionId}`, and `/t/<storeSlug>/checkout/cancel` does not call the API. A production build serves those routes through the SPA fallback.

Signed-out buyers open `/t/<storeSlug>` for the product list and `/t/<storeSlug>/p/<productId>` for one product. Buy posts `{ storeSlug, productId, quantity }` to `POST /v1/public/checkout` and navigates to the returned `url`. That call lives in `src/lib/api/public-store.ts`. Signed-in admins still land on the dashboard at `/t/<storeSlug>`.

### Mock

`npm run dev` loads `VITE_USE_MOCK=true` from [`.env.development`](.env.development) and answers `/v1` inside the browser. [`.env.production`](.env.production) sets `VITE_USE_MOCK=false`, so `npm run build` calls the live API. Playwright builds with `VITE_USE_MOCK=true` and then serves that preview, so the screenshot run stays on the mock.

A shell value overrides the env files. Restart Vite after changing it.

### Same origin as the API

`npm run build` leaves the mock off and leaves the base empty, so `fetch` uses relative `/v1/...` URLs. Serve `dist` from the FastAPI process so the browser and the API share an origin:

```bash
npm run build
```

### Another origin

```bash
VITE_USE_MOCK=false VITE_API_BASE=http://127.0.0.1:8000 npm run build
```

`VITE_API_BASE` defaults to empty. `VITE_API_BASE_URL` is the previous name. It is still read when `VITE_API_BASE` is unset, and it does not turn the mock on.

See [docs/api-contract.md](docs/api-contract.md) and [docs/structure.md](docs/structure.md).

## Scope

This repo does not deploy, and it does not include a deploy workflow. Payment settings never collect secret keys.
