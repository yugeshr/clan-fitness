// Minimal service worker: satisfies PWA "installable" criteria (Chrome/Android
// requires a registered service worker with a fetch handler) and handles Web Push.
// Deliberately does not cache anything — no offline support yet.
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Deliberately no clients.claim() here: forcing an already-open page to switch from
// uncontrolled to SW-controlled mid-session is a known source of broken in-flight navigations
// on iOS Safari (observed: page renders, then the browser shows a native "couldn't load" error
// right after this SW activates). skipWaiting() alone is enough for the new SW to take over on
// each page's *next* load — pages already open when a new version ships pick it up next visit.
self.addEventListener("activate", () => {});

self.addEventListener("fetch", () => {
  // No-op: let the browser handle every request normally.
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon-192",
        badge: "/badge-96",
        data: { url: data.url ?? "/" },
      });
      // Home-screen app icon badge (Chrome/Android, Safari 16.4+/iOS when installed). Feature-
      // detected since older browsers/iOS versions don't support the Badging API at all.
      if (typeof data.unreadCount === "number" && "setAppBadge" in navigator) {
        if (data.unreadCount > 0) {
          await navigator.setAppBadge(data.unreadCount);
        } else {
          await navigator.clearAppBadge();
        }
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
