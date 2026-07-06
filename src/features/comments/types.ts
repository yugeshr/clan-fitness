export const COMMENT_MAX_LENGTH = 300;

/**
 * Ceiling on the raw stored text (mention markup like `@[Name](userId)` is longer than what's
 * displayed). COMMENT_MAX_LENGTH is enforced against the rendered/plain-text length instead.
 */
export const COMMENT_MAX_RAW_LENGTH = 2000;
