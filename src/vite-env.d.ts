/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin. Empty means the same origin. Previous name: VITE_API_BASE_URL. */
  readonly VITE_API_BASE?: string;
  /** Previous name of VITE_API_BASE. Used only when VITE_API_BASE is unset. */
  readonly VITE_API_BASE_URL?: string;
  /** "true" or "1" answers /v1 with the in-memory mock. */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
