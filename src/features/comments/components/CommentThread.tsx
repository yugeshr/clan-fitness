"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { addComment, deleteComment } from "../actions";
import { parseCommentSegments } from "../mentions";
import type { CommentWithUser } from "../queries";
import { COMMENT_MAX_RAW_LENGTH } from "../types";

export type ClanMemberOption = { id: string; name: string; avatarUrl: string | null };

const MENTION_TRIGGER = /(?:^|\s)@([^\s@]*)$/;
const MAX_MENTION_SUGGESTIONS = 5;

export function CommentThread({
  checkInId,
  comments,
  currentUserId,
  clanMembers = [],
  onCommentsChange,
}: {
  checkInId: string;
  comments: CommentWithUser[];
  currentUserId?: string | null;
  clanMembers?: ClanMemberOption[];
  onCommentsChange: (next: CommentWithUser[]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return clanMembers
      .filter((member) => member.id !== currentUserId && member.name.toLowerCase().includes(query))
      .slice(0, MAX_MENTION_SUGGESTIONS);
  }, [mentionQuery, clanMembers, currentUserId]);

  function handleTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setText(value);

    const caret = event.target.selectionStart ?? value.length;
    const match = MENTION_TRIGGER.exec(value.slice(0, caret));
    setMentionQuery(match ? match[1] : null);
    setHighlightedIndex(0);
  }

  function selectMention(member: ClanMemberOption) {
    const input = inputRef.current;
    const caret = input?.selectionStart ?? text.length;
    const match = MENTION_TRIGGER.exec(text.slice(0, caret));
    if (!match) return;

    const mentionStart = caret - match[1].length - 1;
    const mentionText = `@[${member.name}](${member.id}) `;
    const next = text.slice(0, mentionStart) + mentionText + text.slice(caret);
    setText(next);
    setMentionQuery(null);

    requestAnimationFrame(() => {
      const cursor = mentionStart + mentionText.length;
      input?.setSelectionRange(cursor, cursor);
      input?.focus();
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (mentionMatches.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((i) => (i + 1) % mentionMatches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      selectMention(mentionMatches[highlightedIndex]);
    } else if (event.key === "Escape") {
      setMentionQuery(null);
    }
  }

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;

    startTransition(async () => {
      const result = await addComment(checkInId, value);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setText("");
      onCommentsChange([...comments, result.comment]);
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      onCommentsChange(comments.filter((comment) => comment.id !== commentId));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {comments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <li key={comment.id} className="flex min-w-0 items-start gap-2">
              <Avatar src={comment.user.avatarUrl} name={comment.user.name} size={24} />
              <p className="min-w-0 flex-1 text-sm text-foreground-secondary">
                <span className="font-semibold text-foreground">{comment.user.name}</span>{" "}
                {parseCommentSegments(comment.text).map((segment, i) =>
                  segment.type === "mention" ? (
                    <span key={i} className="font-semibold text-accent">
                      @{segment.name}
                    </span>
                  ) : (
                    <span key={i}>{segment.value}</span>
                  ),
                )}
              </p>
              {comment.userId === currentUserId && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={pending}
                  aria-label="Delete comment"
                  className="-m-2 shrink-0 p-2 text-xs text-foreground-muted hover:text-danger"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          {mentionMatches.length > 0 && (
            <ul className="absolute bottom-full left-0 z-10 mb-1 w-56 max-w-[80vw] overflow-hidden rounded-lg border border-surface-border bg-surface shadow-lg">
              {mentionMatches.map((member, i) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectMention(member)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      i === highlightedIndex ? "bg-background text-foreground" : "text-foreground-secondary"
                    }`}
                  >
                    <Avatar src={member.avatarUrl} name={member.name} size={20} />
                    {member.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={inputRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setMentionQuery(null)}
            maxLength={COMMENT_MAX_RAW_LENGTH}
            placeholder="Add a comment... (@ to mention)"
            className="w-full min-w-0 rounded-lg border border-surface-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-foreground-muted sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="shrink-0 text-sm font-semibold text-accent disabled:opacity-40"
        >
          Post
        </button>
      </form>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
