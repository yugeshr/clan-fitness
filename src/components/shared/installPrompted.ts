const STORAGE_KEY = "install-prompted";

/** Whether we've already asked this browser/device about installing the PWA (installed, skipped, or dismissed). */
export function hasBeenPromptedToInstall() {
  return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
}

export function markInstallPrompted() {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
}
