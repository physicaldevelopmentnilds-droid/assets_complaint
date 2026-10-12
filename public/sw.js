self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = {}; }
  const reference = typeof data.reference === "string" && /^ASSET-\d{4}-\d{6}$/.test(data.reference) ? data.reference : null;
  const reminder = data.kind === "reminder";
  const title = reminder ? "Asset complaint reminder received" : "New asset complaint received";
  event.waitUntil(self.registration.showNotification(title, { body: reference || "Open NILDS to view the complaint.", tag: `nilds-${reference || "asset"}`, data: { url: reference ? `/complaints/${reference}` : "/complaints" } }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url || "/complaints";
  event.waitUntil(self.clients.openWindow(new URL(path, self.location.origin).href));
});
