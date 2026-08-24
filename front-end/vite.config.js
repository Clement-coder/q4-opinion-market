import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      /* Use injectManifest so we control the full SW logic in src/sw.js */
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",

      /* Output the SW as sw.js at the root — matches the default Workbox expectation */
      outDir: "dist",

      registerType: "prompt",          /* Let usePWA() handle when to apply updates */
      injectRegister: false,           /* We register manually via registerSW() in usePWA.js */

      /* Files to precache — vite-plugin-pwa injects the manifest into self.__WB_MANIFEST */
      includeAssets: [
        "favicon.jpg",
        "favicon.svg",
        "og-image.png",
        "quai-logo.png",
        "icons/*.png",
      ],

      manifest: false, /* We ship our own /public/manifest.json */

      workbox: {
        /* These are passed to injectManifest */
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2,ttf}"],
        globIgnores: ["**/node_modules/**"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, /* 4 MB */
      },

      devOptions: {
        enabled: true,            /* Enable SW in dev so you can test it */
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ],
});
