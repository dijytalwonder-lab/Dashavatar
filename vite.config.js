import { defineConfig } from 'vite';

// Base './' so the built assets use relative paths — required for Capacitor
// (the Android WebView loads from file://.../index.html, not a web root).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000
  },
  server: {
    host: true,
    port: 5173
  }
});
