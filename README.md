# Loom

Loom is a multi-tenant store admin. This repository is the frontend: a React dashboard for products, inventory, orders, and store settings. The API is described in [`openapi.yaml`](openapi.yaml) and answered by an in-memory mock until a backend exists.

The sample workspace is **Daykodee** (`/t/daykodee`). A second workspace, **Harbor Sample**, is included so tenant switching and data isolation can be checked. Catalog copy, addresses, and emails are placeholders such as Sample Tote Bag and `hello@example.com`.

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Signed-out visitors land on `/sign-in`. The sample account is `alex.sample@example.com` / `sample-password`. After sign-in the app opens `/t/daykodee`.

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

## Live API

Copy [`.env.example`](.env.example) to `.env` and set the origin:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Restart Vite after changing it. The client keeps the same paths, sends `credentials: "include"`, and sends `X-Tenant-Id` on every tenant-owned call. It does not store tokens in `localStorage`. Continue with Google navigates the browser to `{origin}/v1/auth/google/start`. With the variable unset, the mock handles those paths inside the browser.

See [docs/api-contract.md](docs/api-contract.md) and [docs/structure.md](docs/structure.md).

## Scope

This repo does not deploy, and it does not include a deploy workflow. Payment settings never collect secret keys.
