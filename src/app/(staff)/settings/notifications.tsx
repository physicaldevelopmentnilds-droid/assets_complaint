"use client";
import { useEffect, useState } from "react";

function toBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export default function Notifications({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState("Checking this device…");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.resolve().then(async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setState("Web Push is unsupported on this device."); return; }
      if (Notification.permission === "denied") { setState("Notifications are blocked in browser settings."); return; }
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      setEnabled(Boolean(subscription));
      setState(subscription ? "This browser has a push subscription. Enable again if you changed accounts." : "Notifications are off for this device.");
    }).catch(() => setState("Unable to inspect this device's notification status."));
  }, []);
  async function enable() {
    if (!publicKey) { setState("Push keys are not configured on this server."); return; }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "Notifications are blocked in browser settings." : "Permission was not granted."); return; }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) });
      const response = await fetch("/api/push/subscriptions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw new Error("Could not save this device subscription.");
      setEnabled(true); setState("Notifications enabled for this device.");
    } catch { setState("Could not enable notifications. Try again after checking browser and server settings."); }
    finally { setBusy(false); }
  }
  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/push/subscriptions", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        if (!response.ok) throw new Error("Could not detach subscription.");
        await subscription.unsubscribe();
      }
      setEnabled(false); setState("Notifications are off for this device.");
    } catch { setState("Could not disable notifications. Try again."); }
    finally { setBusy(false); }
  }
  return <div><p role="status">{state}</p><div className="action-row"><button className="button" type="button" disabled={busy || !publicKey} onClick={enable}>Enable notifications</button><button type="button" disabled={busy || !enabled} onClick={disable}>Disable on this device</button></div></div>;
}
