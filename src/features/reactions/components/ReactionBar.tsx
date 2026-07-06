"use client";

import { useTransition } from "react";
import { toggleReaction } from "../actions";
import { REACTION_EMOJIS } from "../types";
import type { ReactionSummary } from "../types";

export function ReactionBar({
  checkInId,
  summary,
  onSummaryChange,
}: {
  checkInId: string;
  summary?: ReactionSummary;
  onSummaryChange: (next: ReactionSummary) => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick(emoji: string) {
    startTransition(async () => {
      const result = await toggleReaction(checkInId, emoji);
      if ("summary" in result) onSummaryChange(result.summary);
    });
  }

  return (
    <div className="flex gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const entry = summary?.[emoji];
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleClick(emoji)}
            disabled={pending}
            className={`flex min-h-9 items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-60 ${
              entry?.reactedByMe
                ? "border-accent text-accent"
                : "border-surface-border text-foreground-tertiary"
            }`}
          >
            <span aria-hidden>{emoji}</span>
            {entry?.count ? entry.count : null}
          </button>
        );
      })}
    </div>
  );
}
