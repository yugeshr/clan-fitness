import { toggleReaction } from "../actions";
import { REACTION_EMOJIS } from "../types";
import type { ReactionSummary } from "../types";

export function ReactionBar({ checkInId, summary }: { checkInId: string; summary?: ReactionSummary }) {
  return (
    <div className="flex gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const entry = summary?.get(emoji);
        return (
          <form key={emoji} action={toggleReaction.bind(null, checkInId, emoji)}>
            <button
              type="submit"
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                entry?.reactedByMe
                  ? "border-accent text-accent"
                  : "border-surface-border text-foreground-tertiary"
              }`}
            >
              <span aria-hidden>{emoji}</span>
              {entry?.count ? entry.count : null}
            </button>
          </form>
        );
      })}
    </div>
  );
}
