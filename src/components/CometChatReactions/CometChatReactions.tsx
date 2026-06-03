import { CometChatReactionsRoot } from './CometChatReactionsRoot';
import { CometChatReactionsBar } from './CometChatReactionsBar';
import { CometChatReactionsChip } from './CometChatReactionsChip';
import { CometChatReactionsInfo } from './CometChatReactionsInfo';
import { CometChatReactionsList } from './CometChatReactionsList';
import { CometChatReactionsOverflow } from './CometChatReactionsOverflow';

/**
 * CometChatReactions — compound component for message reactions.
 *
 * Displays emoji reaction chips on message bubbles with hover tooltips
 * showing who reacted, a full reactor list popover with tab filtering,
 * and overflow handling for many reactions.
 *
 * Usage (default layout):
 * ```tsx
 * <CometChatReactions.Root
 *   message={message}
 *   alignment="right"
 *   onReactionClick={(emoji, msg) => handleReaction(emoji, msg)}
 * />
 * ```
 *
 * Usage (custom layout):
 * ```tsx
 * <CometChatReactions.Root message={message}>
 *   <CometChatReactions.Bar maxVisible={5} />
 * </CometChatReactions.Root>
 * ```
 *
 * Usage (standalone list):
 * ```tsx
 * <CometChatReactions.Root message={message}>
 *   <CometChatReactions.List />
 * </CometChatReactions.Root>
 * ```
 */
export const CometChatReactions = {
  Root: CometChatReactionsRoot,
  Bar: CometChatReactionsBar,
  Chip: CometChatReactionsChip,
  Info: CometChatReactionsInfo,
  List: CometChatReactionsList,
  Overflow: CometChatReactionsOverflow,
} as const;
