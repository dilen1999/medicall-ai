/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["icons/*.png", "offline.html"],
      manifest: {
        name: "MediCall Care",
        short_name: "MediCall",
        description: "Order healthcare products safely and track deliveries with MediCall Care.",
        theme_color: "#0F766E",
        background_color: "#F8FAFC",
        display: "standalone",
        start_url: "/",
        orientation: "portrait",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              ["style", "script", "worker", "font", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => /\/(products|categories)(\/|\?|$)/.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "catalogue-cache" },
          },
          {
            urlPattern: ({ url }) => /\/(orders|notifications|customers)(\/|\?|$)/.test(url.pathname),
            handler: "NetworkFirst",
            options: { cacheName: "account-data-cache", networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: ({ url }) =>
              /\/(auth|payments|prescriptions|support\/cases\/.*\/evidence|live-location)(\/|\?|$)/.test(
                url.pathname,
              ),
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Tests always exercise mock mode, regardless of any local .env.local
    // override used to point the dev server at a real backend.
    env: { VITE_ENABLE_MOCKS: "true" },
    css: true,
  },
});
