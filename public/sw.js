// Her refuge's service worker: it only shows the gift notifications (src/lib/avisos.ts) and opens
// «regalos» when one is tapped. No fetch handler, no cache — the app works exactly as without it.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {}
  event.waitUntil(
    self.registration.showNotification(d.title || "tu refugio", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/badge-96.png",
      tag: d.tag,
      renotify: !!d.tag,
      data: { url: d.url || "/regalos" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/regalos", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const abierta = ventanas.find((c) => c.url.startsWith(self.location.origin));
      if (abierta) {
        await abierta.focus();
        try {
          await abierta.navigate(url);
        } catch {}
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
