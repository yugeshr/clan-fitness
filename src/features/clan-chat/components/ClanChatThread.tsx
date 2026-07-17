"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { MentionInput, type MentionInputHandle, type MentionMember } from "@/components/shared/MentionInput";
import { Button } from "@/components/ui/button";
import { parseCommentSegments } from "@/lib/mentions";
import { fetchClanMessages, sendClanMessage } from "../actions";
import type { ClanMessageRow } from "../queries";
import { CLAN_MESSAGE_MAX_LENGTH } from "../types";

const POLL_INTERVAL_MS = 2000;

function chatSeenKey(clanId: string) {
  return `clan-chat-seen:${clanId}`;
}

/**
 * "Near-zero latency" without any new realtime infrastructure: the sender's own message appears
 * immediately (optimistic, before the server confirms) and a 2s poll picks up every other
 * member's messages — more than fast enough for a clan-sized group, at zero added infra cost. The
 * poll interval is always cleared on unmount with no conditional path that could skip it.
 */
export function ClanChatThread({
  clanId,
  currentUser,
  members,
  initialMessages,
}: {
  clanId: string;
  currentUser: { id: string; name: string; avatarUrl: string | null };
  members: MentionMember[];
  initialMessages: ClanMessageRow[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const listRef = useRef<HTMLDivElement>(null);
  const mentionInputRef = useRef<MentionInputHandle>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await fetchClanMessages(clanId);
      setMessages(fresh);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [clanId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  // Marks this clan's chat "seen" the moment it's opened — same "visiting the page marks it seen"
  // model BottomNav already uses for the feed's own unread dot (see feedSeenKey there), just keyed
  // per-feature so the two dots track independently.
  useEffect(() => {
    localStorage.setItem(chatSeenKey(clanId), new Date().toISOString());
  }, [clanId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const displayBody = text.trim();
    if (!displayBody || pending) return;
    const markupBody = mentionInputRef.current?.getMarkupValue().trim() || displayBody;

    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        clanId,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl,
        body: markupBody,
        createdAt: new Date(),
      },
    ]);
    setText("");
    mentionInputRef.current?.reset();
    setPending(true);
    setError(undefined);

    const formData = new FormData();
    formData.set("body", markupBody);
    const result = await sendClanMessage(clanId, undefined, formData);
    setPending(false);

    if (result?.error) {
      setError(result.error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      return;
    }

    setMessages(await fetchClanMessages(clanId));
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div ref={listRef} className="flex flex-col gap-3 overflow-y-auto pb-24">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-foreground-tertiary">
            No messages yet — say hi to your clan.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.userId === currentUser.id;
          return (
            <div key={message.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {!mine && <Avatar src={message.authorAvatarUrl} name={message.authorName} size={28} />}
              <div className={`flex max-w-[75%] flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                {!mine && (
                  <span className="px-1 text-xs font-semibold text-foreground-tertiary">
                    {message.authorName}
                  </span>
                )}
                <p
                  className={`whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm ${
                    mine
                      ? "bg-accent text-accent-foreground"
                      : "border border-surface-border bg-surface text-foreground-secondary"
                  }`}
                >
                  {parseCommentSegments(message.body).map((segment, i) =>
                    segment.type === "mention" ? (
                      <span key={i} className={`font-semibold ${mine ? "" : "text-accent"}`}>
                        @{segment.name}
                      </span>
                    ) : (
                      <span key={i}>{segment.value}</span>
                    ),
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed above BottomNav on mobile (BottomNav is h-16 + its own safe-area padding, hidden
          from sm: up, matching the same bottom offset math used elsewhere — see toast.tsx). Inner
          content re-applies the page's own max-w-2xl/px-6 since a fixed element spans the full
          viewport width, unlike the normal-flow content around it. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-surface-border bg-surface sm:bottom-0">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-2 px-6 py-3">
          <MentionInput
            ref={mentionInputRef}
            value={text}
            onChange={setText}
            members={members}
            excludeUserId={currentUser.id}
            maxLength={CLAN_MESSAGE_MAX_LENGTH}
            placeholder="Type a message... (@ to mention)"
          />
          <Button type="submit" disabled={pending || !text.trim()}>
            Send
          </Button>
        </form>
        {error && <p className="mx-auto max-w-2xl px-6 pb-2 text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
