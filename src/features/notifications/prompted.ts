const STORAGE_KEY = "push-notifications-prompted";

/** Whether we've already asked this browser/device about push notifications (enabled, skipped, or denied). */
export function hasBeenPrompted() {
  return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
}

export function markPrompted() {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
}
