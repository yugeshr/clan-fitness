export { getNotificationsAndMarkRead, sendTestNotification, subscribeToPush, unsubscribeFromPush } from "./actions";
export { AutoEnableNotifications } from "./components/AutoEnableNotifications";
export { NotificationBell } from "./components/NotificationBell";
export { PushNotificationManager } from "./components/PushNotificationManager";
// Read-only: lets InstallPrompt (a different feature) wait for this one-time ask to resolve
// before showing its own, so the two never overlap. markPrompted stays unexported — only this
// feature's own components should ever set it.
export { hasBeenPrompted } from "./prompted";
export type { NotificationPayload, NotificationType, PushSubscriptionInput } from "./types";

// `notifyUser` (./send) is intentionally not re-exported here: it pulls in `web-push`,
// which depends on Node built-ins (net/tls) that break the client bundle if this barrel
// is ever imported from a Client Component. Import it directly: `@/features/notifications/send`.
