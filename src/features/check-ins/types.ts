export type CheckInType = "gym" | "steps" | "food";
export type CheckInVisibility = "public_to_clan" | "private";
export type FoodStatus = "yes" | "no" | "partial";

export type GymCheckInValue = { note?: string; durationMinutes?: number };
export type StepsCheckInValue = { count: number };
// status is optional: a photo can be logged on its own, independent of answering the nutrition question.
export type FoodCheckInValue = { status?: FoodStatus; note?: string; photoUrl?: string };
