// Used as the nudge notification's title — the prominent, bolded line in NotificationBell's
// list (the body is small and truncated), so the quirky part belongs here, not buried in the
// body. Picked once at send time and frozen into the notification row, so plain randomness is
// fine — no need for a deterministic seed the way the food-status feed captions needed one.
const NUDGE_MESSAGES = [
  "Your streak called. It's worried.",
  "Today's log is feeling a little empty.",
  "This is your sign to log today.",
  "The log won't fill itself in.",
  "No pressure. Okay, some pressure.",
  "Don't leave your squad hanging.",
  "A wild reminder appeared!",
  "Tick tock — log o'clock.",
  "Your future self says: log now.",
  "Someone's watching your empty log. (Lovingly.)",
];

export function pickNudgeMessage(): string {
  return NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
}
