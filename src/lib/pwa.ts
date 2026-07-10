/** Shared across push-notification and install-prompt features: both need to know whether the
 * app is already running as an installed PWA, since the behavior/APIs available differ before and
 * after (iOS only exposes the Push API in standalone mode; there's no point prompting to install
 * something that's already installed). */
export function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}
