import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', '@radix-ui/react-tabs'],
          'chart-vendor': ['recharts', 'd3'],
        },
      },
    },
  },
})
