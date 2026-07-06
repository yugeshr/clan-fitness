export { subscribeToPush, unsubscribeFromPush } from "./actions";
export { AutoEnableNotifications } from "./components/AutoEnableNotifications";
export { PushNotificationManager } from "./components/PushNotificationManager";
export type { NotificationPayload, PushSubscriptionInput } from "./types";

// `notifyUser` (./send) is intentionally not re-exported here: it pulls in `web-push`,
// which depends on Node built-ins (net/tls) that break the client bundle if this barrel
// is ever imported from a Client Component. Import it directly: `@/features/notifications/send`.
