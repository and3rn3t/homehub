import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA Service Worker for caching and performance
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', '*.png', '*.svg'],
      manifest: {
        name: 'HomeHub',
        short_name: 'HomeHub',
        description: 'iOS-inspired home automation dashboard',
        theme_color: '#4a9eff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.cloudflareaccess\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cloudflare-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
  },
  define: {
    // Define process.env for browser environment (required by @koush/arlo)
    'process.env': JSON.stringify({}),
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify('v20.0.0'),
    global: 'globalThis',
  },
  // Cloudflare Pages configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunk splitting for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: id => {
          // Split by node_modules for granular caching
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'radix-vendor'
            }
            // Chart libraries (heavy, load on-demand)
            if (id.includes('recharts') || id.includes('d3')) {
              return 'chart-vendor'
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'animation-vendor'
            }
            // Icon library
            if (id.includes('lucide-react') || id.includes('@phosphor-icons')) {
              return 'icon-vendor'
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'form-vendor'
            }
            // Other vendor code
            return 'vendor'
          }
        },
      },
    },
  },
})
