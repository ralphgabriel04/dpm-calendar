/// <reference lib="webworker" />

// DPM Calendar Service Worker
// Handles push notifications and offline caching

const CACHE_NAME = "dpm-calendar-v1";
const OFFLINE_URL = "/offline";

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        "/lightLogoFinal.png",
        "/darkLogoFinal.png",
      ]);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Push notification event
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event with no data");
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "",
      icon: data.icon || "/lightLogoFinal.png",
      badge: "/badge-72x72.png",
      tag: data.tag || "dpm-notification",
      renotify: data.renotify || false,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      data: {
        url: data.url || "/",
        notificationId: data.notificationId,
        type: data.type,
      },
      actions: data.actions || [],
      vibrate: data.vibrate || [200, 100, 200],
    };

    // Add timestamp if provided
    if (data.timestamp) {
      options.timestamp = data.timestamp;
    }

    event.waitUntil(
      self.registration.showNotification(data.title || "DPM Calendar", options)
    );
  } catch (error) {
    console.error("Error processing push notification:", error);

    // Fallback notification
    event.waitUntil(
      self.registration.showNotification("DPM Calendar", {
        body: event.data.text(),
        icon: "/lightLogoFinal.png",
      })
    );
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";
  const action = event.action;

  event.waitUntil(
    (async () => {
      // Handle action buttons
      if (action) {
        switch (action) {
          case "complete":
            // Mark task as complete
            await fetch("/api/notifications/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "complete",
                notificationId: event.notification.data?.notificationId,
              }),
            });
            break;
          case "snooze":
            // Snooze notification for 10 minutes
            await fetch("/api/notifications/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "snooze",
                notificationId: event.notification.data?.notificationId,
                duration: 10,
              }),
            });
            break;
          case "dismiss":
            // Just close, already done above
            break;
        }
      }

      // Focus existing window or open new one
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Try to focus an existing window
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          await client.focus();
          client.navigate(url);
          return;
        }
      }

      // Open a new window if none found
      await self.clients.openWindow(url);
    })()
  );
});

// Notification close event (user dismissed)
self.addEventListener("notificationclose", (event) => {
  const notificationId = event.notification.data?.notificationId;

  if (notificationId) {
    // Report dismissal to server
    fetch("/api/notifications/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "dismiss",
        notificationId,
      }),
    }).catch(console.error);
  }
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Sync any pending notification actions when back online
  const cache = await caches.open(CACHE_NAME);
  const pendingActions = await cache.match("pending-actions");

  if (pendingActions) {
    const actions = await pendingActions.json();

    for (const action of actions) {
      try {
        await fetch("/api/notifications/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
      } catch (error) {
        console.error("Failed to sync action:", error);
      }
    }

    // Clear pending actions
    await cache.delete("pending-actions");
  }
}

// Periodic background sync for upcoming reminders
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-reminders") {
    event.waitUntil(checkUpcomingReminders());
  }
});

async function checkUpcomingReminders() {
  try {
    const response = await fetch("/api/notifications/upcoming");
    const notifications = await response.json();

    for (const notification of notifications) {
      await self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: "/lightLogoFinal.png",
        tag: `reminder-${notification.id}`,
        data: notification.data,
      });
    }
  } catch (error) {
    console.error("Failed to check reminders:", error);
  }
}
