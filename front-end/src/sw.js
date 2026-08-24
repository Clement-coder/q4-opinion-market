/**
 * sw.js — Q4 PWA Service Worker
 *
 * Strategy:
 *  • App shell (HTML, JS, CSS, fonts) — Cache-First with network fallback
 *  • API / Supabase / Firebase calls    — Network-First, no caching (live data)
 *  • Images / static assets            — Cache-First, long TTL
 *  • Offline fallback page             — served from cache when network fails
 *
 * Uses Workbox (injected by vite-plugin-pwa via injectManifest mode).
 */

import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

/* ── Take control of all clients immediately on activation ── */
self.skipWaiting();
clientsClaim();

/* ── Precache everything vite-plugin-pwa injected ── */
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

/* ── SPA navigation: always serve index.html from cache ── */
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    // Never intercept API / Supabase / Firebase requests
    denylist: [
      /^\/api\//,
      /supabase\.co/,
      /firestore\.googleapis\.com/,
      /firebase\.googleapis\.com/,
      /coingecko\.com/,
    ],
  })
);

/* ── Google Fonts stylesheets: stale-while-revalidate ── */
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: "q4-google-fonts-stylesheets",
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

/* ── Google Fonts / cdnfonts files: cache-first, 1 year ── */
registerRoute(
  ({ url }) =>
    url.origin === "https://fonts.gstatic.com" ||
    url.origin === "https://fonts.cdnfonts.com",
  new CacheFirst({
    cacheName: "q4-google-fonts-webfonts",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 30 }),
    ],
  })
);

/* ── Static images: cache-first, 30 days ── */
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "q4-images",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 30, maxEntries: 60 }),
    ],
  })
);

/* ── JS / CSS bundles not already precached: stale-while-revalidate ── */
registerRoute(
  ({ request }) =>
    request.destination === "script" || request.destination === "style",
  new StaleWhileRevalidate({ cacheName: "q4-static-resources" })
);

/* ── Supabase / Firebase / CoinGecko: network-only (live data, no cache) ── */
registerRoute(
  ({ url }) =>
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("coingecko.com") ||
    url.hostname.includes("blippay.me"),
  new NetworkFirst({
    cacheName: "q4-api-responses",
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 5, maxEntries: 50 }), // 5 min fallback only
    ],
  })
);

/* ── Background sync: queue failed position stakes for retry ── */
// (placeholder — wire up when BackgroundSync API is needed)

/* ── Push notification handler ── */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "Q4", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Q4 Opinion Market", {
      body:    payload.body ?? "",
      icon:    "/icons/icon-192x192.png",
      badge:   "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data:    { url: payload.url ?? "/dashboard/home" },
      actions: payload.actions ?? [],
    })
  );
});

/* ── Notification click: open / focus the app ── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/dashboard/home";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
