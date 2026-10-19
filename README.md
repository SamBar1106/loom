# Loom

Loom is a multi-tenant store admin. This repository is the frontend: a React dashboard for products, inventory, orders, and store settings. The API is described in [`openapi.yaml`](openapi.yaml). The default dev server and production build answer it with an in-memory mock. A build with `VITE_USE_MOCK=false` calls a live API on the same origin, or on `VITE_API_BASE`.

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

### Mock

`npm run dev` and `npm run build` load `VITE_USE_MOCK=true` from [`.env.development`](.env.development) and [`.env.production`](.env.production). Those builds answer `/v1` inside the browser. Playwright's preview uses that production build, so it stays on the mock. GitHub Pages settings are left as they are; a rebuild of this app stays on the mock because the production env file sets the flag.

A shell value overrides the env files. Restart Vite after changing it.

### Same origin as the API

Build without the mock and leave the base empty so `fetch` uses relative `/v1/...` URLs. Serve `dist` from the FastAPI process so the browser and the API share an origin:

```bash
VITE_USE_MOCK=false npm run build
```

### Another origin

```bash
VITE_USE_MOCK=false VITE_API_BASE=http://127.0.0.1:8000 npm run build
```

`VITE_API_BASE` defaults to empty. `VITE_API_BASE_URL` is the previous name. It is still read when `VITE_API_BASE` is unset, and it does not turn the mock on.

See [docs/api-contract.md](docs/api-contract.md) and [docs/structure.md](docs/structure.md).

## Scope

This repo does not deploy, and it does not include a deploy workflow. Payment settings never collect secret keys.
