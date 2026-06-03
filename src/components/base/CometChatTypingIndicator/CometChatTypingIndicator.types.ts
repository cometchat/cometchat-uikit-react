import type { HTMLAttributes } from 'react';

/** Props for CometChatTypingIndicator. */
export interface CometChatTypingIndicatorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /**
   * Display names of users currently typing.
   * - Empty array: renders nothing.
   * - The component is SDK-agnostic — the parent maps SDK TypingIndicator objects to name strings.
   */
  typingNames: string[];
  /**
   * Whether this is a group conversation.
   * Affects how the typing text is displayed:
   * - `false` (1-on-1): "typing..."
   * - `true` (group, 1 user): "{name} is typing..."
   * - `true` (group, 2 users): "{name1} and {name2} are typing..."
   * - `true` (group, 3+ users): "Multiple people are typing..."
   */
  isGroupChat?: boolean;
  /** Optional custom className. */
  className?: string;
}
