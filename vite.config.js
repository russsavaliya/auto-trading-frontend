import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// The page's own warm-neutral canvas. Used for the installed app's status bar
// and splash, so opening it from the home screen never flashes a colour the
// dashboard does not use.
const CANVAS = '#fafaf9';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Never swap code under an open dashboard: a new version waits until
      // the operator taps "Update" (see components/pwa/UpdateBanner.jsx).
      registerType: 'prompt',
      injectRegister: false,
      // Vercel Deployment Protection sits in front of this site. Without
      // credentials the browser's manifest request is redirected to the Vercel
      // login, and the phone silently refuses to offer "Install".
      useCredentials: true,
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'Trading Admin',
        short_name: 'Trading Admin',
        description: 'BANKNIFTY options bot: live status, open positions and P&L.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: CANVAS,
        theme_color: CANVAS,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only the app shell is cached. The bridge API is another origin and
        // is deliberately never cached: on a trading screen a stale position or
        // P&L is worse than an error saying the server cannot be reached.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Lets every module import from the src root ('@/components/ui/Card')
      // instead of counting '../../' levels, which is what made the old flat
      // layout hard to move files around in.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
