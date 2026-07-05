export const REACTION_EMOJIS = ["🔥", "👏", "💪"] as const;

export type ReactionSummary = Record<string, { count: number; reactedByMe: boolean }>;
