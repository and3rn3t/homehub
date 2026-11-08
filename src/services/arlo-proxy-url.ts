/**
 * Base URL of the Arlo proxy.
 *
 * Default is same origin ('/api/arlo'): in production a Pages Function forwards it to the proxy
 * worker behind Cloudflare Access, and in development the Vite dev server proxies it to
 * `npm run proxy:dev` (see vite.config.ts). VITE_ARLO_PROXY_URL is a development-only override;
 * do not set it in production.
 */
export const ARLO_PROXY_BASE_URL: string = import.meta.env.VITE_ARLO_PROXY_URL ?? '/api/arlo'
