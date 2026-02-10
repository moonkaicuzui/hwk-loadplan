import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Firebase
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],

          // Charts - Recharts
          'recharts-vendor': ['recharts'],

          // i18n
          'i18n-vendor': ['i18next', 'react-i18next'],

          // UI libraries
          'ui-vendor': ['lucide-react'],

          // Excel export
          'xlsx-vendor': ['xlsx']
        }
      }
    },
    // Chunk size warning threshold
    chunkSizeWarningLimit: 600,
    // Minification (use default esbuild, faster than terser)
    minify: 'esbuild',
    // Source maps for production debugging (but not too detailed)
    sourcemap: false,
    // Target modern browsers
    target: 'es2020'
  },
  // Preview server (production build preview)
  preview: {
    port: 4173
  },
  // Development server configuration
  server: {
    port: 3000,
    open: true
  }
})
