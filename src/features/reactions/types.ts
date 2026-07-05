export const REACTION_EMOJIS = ["🔥", "👏", "💪"] as const;

export type ReactionSummary = Map<string, { count: number; reactedByMe: boolean }>;
