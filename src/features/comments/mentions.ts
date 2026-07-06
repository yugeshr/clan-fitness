/**
 * Mentions are stored inline as `@[Display Name](userId)`, chosen over plain `@name` matching
 * because member names can contain spaces and aren't unique — encoding the userId lets us
 * render and notify precisely without guessing where a mention ends.
 */
const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g;

export type CommentSegment = { type: "text"; value: string } | { type: "mention"; name: string; userId: string };

export function extractMentionedUserIds(text: string): string[] {
  return [...text.matchAll(MENTION_PATTERN)].map((match) => match[2]);
}

/** Renders mention markup as human-readable `@Name`, for notification bodies and any plain-text use. */
export function mentionsToPlainText(text: string): string {
  return text.replace(MENTION_PATTERN, "@$1");
}

/** Splits comment text into plain-text and mention segments for rich rendering. */
export function parseCommentSegments(text: string): CommentSegment[] {
  const segments: CommentSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ type: "text", value: text.slice(lastIndex, index) });
    segments.push({ type: "mention", name: match[1], userId: match[2] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: "text", value: text.slice(lastIndex) });

  return segments;
}
