/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KV_API_URL: string
  readonly VITE_KV_AUTH_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string
