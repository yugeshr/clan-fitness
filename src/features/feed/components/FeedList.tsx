"use client";

import Image from "next/image";
import { useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import type { FeedRow } from "@/features/check-ins";
import type { FoodCheckInValue } from "@/features/check-ins/types";
import { ReactionBar } from "@/features/reactions";
import type { ReactionSummary } from "@/features/reactions";
import { loadMoreFeed } from "../actions";
import { describeCheckIn, formatDayLabel, groupByDay, groupByUserAndDay, TYPE_ICON } from "../group";

export function FeedList({
  clanId,
  initialRows,
  initialReactions,
  initialHasMore,
}: {
  clanId: string;
  initialRows: FeedRow[];
  initialReactions: Record<string, ReactionSummary>;
  initialHasMore: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [reactions, setReactions] = useState(initialReactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function handleLoadMore() {
    const cursor = rows[rows.length - 1]?.checkIn.createdAt;
    if (!cursor) return;

    setLoading(true);
    try {
      const page = await loadMoreFeed(clanId, cursor.toISOString());
      setRows((prev) => [...prev, ...page.rows]);
      setReactions((prev) => ({ ...prev, ...page.reactions }));
      setHasMore(page.hasMore);
    } finally {
      setLoading(false);
    }
  }

  const sections = groupByDay(groupByUserAndDay(rows));

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.day} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
            {formatDayLabel(section.day)}
          </h3>
          <ul className="flex flex-col gap-3">
            {section.cards.map((group) => (
              <li
                key={group.user.id}
                className="flex items-start gap-3 rounded-lg border border-surface-border bg-surface p-3"
              >
                <Avatar src={group.user.avatarUrl} name={group.user.name} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {group.user.name}
                    </span>
                    <time
                      className="shrink-0 text-xs text-foreground-muted"
                      dateTime={group.latestAt.toISOString()}
                    >
                      {group.latestAt.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  {group.entries.map((checkIn) => {
                    const photoUrl =
                      checkIn.type === "food" ? (checkIn.value as FoodCheckInValue).photoUrl : undefined;
                    return (
                      <div key={checkIn.id} className="flex flex-col gap-2">
                        <p className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                          <span aria-hidden>{TYPE_ICON[checkIn.type] ?? "✅"}</span>
                          {describeCheckIn(checkIn.type, checkIn.value)}
                        </p>
                        {photoUrl && (
                          <Image
                            src={photoUrl}
                            alt=""
                            width={320}
                            height={240}
                            className="max-h-60 w-full max-w-xs rounded-lg border border-surface-border object-cover"
                          />
                        )}
                      </div>
                    );
                  })}
                  <ReactionBar checkInId={group.entries[0].id} summary={reactions[group.entries[0].id]} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loading}
          className="min-h-11 self-center px-4 text-sm font-semibold text-accent disabled:opacity-40"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
