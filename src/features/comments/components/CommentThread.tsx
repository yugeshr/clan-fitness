"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { addComment, deleteComment } from "../actions";
import type { CommentWithUser } from "../queries";
import { COMMENT_MAX_LENGTH } from "../types";

export function CommentThread({
  checkInId,
  comments,
  currentUserId,
  onCommentsChange,
}: {
  checkInId: string;
  comments: CommentWithUser[];
  currentUserId?: string | null;
  onCommentsChange: (next: CommentWithUser[]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

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
                <span className="font-semibold text-foreground">{comment.user.name}</span> {comment.text}
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
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder="Add a comment..."
          className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-foreground-muted sm:text-sm"
        />
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
