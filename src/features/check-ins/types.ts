export type CheckInType = "gym" | "steps" | "food";
export type CheckInVisibility = "public_to_clan" | "private";
export type FoodStatus = "yes" | "no" | "partial";

export type GymCheckInValue = { note?: string; durationMinutes?: number };
export type StepsCheckInValue = { count: number };
// status is optional: photos can be logged on their own, independent of answering the nutrition
// question. Max 3 photos, enforced client-side (DailyLogForm) and server-side (logDailyCheckIn).
export type FoodCheckInValue = { status?: FoodStatus; note?: string; photoUrls?: string[] };
