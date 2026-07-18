export {
  getNotificationsAndMarkRead,
  subscribeToPush,
  unsubscribeFromPush,
  updateNotificationPreferences,
} from "./actions";
export { AutoEnableNotifications } from "./components/AutoEnableNotifications";
export { NotificationBell } from "./components/NotificationBell";
export { NotificationPreferencesForm } from "./components/NotificationPreferencesForm";
export { PushNotificationManager } from "./components/PushNotificationManager";
export { getNotificationPreferences } from "./queries";
export type { NotificationPayload, NotificationType, PushSubscriptionInput } from "./types";
export type { NotificationPreferencesActionState } from "./actions";

// `notifyUser` (./send) is intentionally not re-exported here: it pulls in `web-push`,
// which depends on Node built-ins (net/tls) that break the client bundle if this barrel
// is ever imported from a Client Component. Import it directly: `@/features/notifications/send`.
