import type { ReactNode } from 'react';

/** Visual state of the conversation summary. */
export type CometChatConversationSummaryState = 'loading' | 'loaded' | 'error' | 'empty';

/** Props for CometChatConversationSummaryRoot. */
export interface CometChatConversationSummaryRootProps {
  /** Async function that returns a summary string. */
  getConversationSummary: () => Promise<string>;
  /** Callback when the close button is clicked. */
  onClose?: (() => void) | undefined;
  /** Optional custom className for the root container. */
  className?: string | undefined;
  /** Children — sub-components for custom composition. */
  children?: ReactNode | undefined;
}

/** Props for CometChatConversationSummaryHeader. */
export interface CometChatConversationSummaryHeaderProps {
  /** Custom title text (overrides default localized text). */
  title?: string | undefined;
  /** Whether to show the close button (default: true). */
  showCloseButton?: boolean | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom header content. */
  children?: ReactNode | undefined;
}

/** Props for CometChatConversationSummaryBody. */
export interface CometChatConversationSummaryBodyProps {
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom body content (overrides default summary text rendering). */
  children?: ReactNode | undefined;
}

/** Props for CometChatConversationSummaryLoading. */
export interface CometChatConversationSummaryLoadingProps {
  /** Number of shimmer bars to display (default: 3). */
  count?: number | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom loading content. */
  children?: ReactNode | undefined;
}

/** Props for CometChatConversationSummaryError. */
export interface CometChatConversationSummaryErrorProps {
  /** Custom error message (overrides default localized text). */
  message?: string | undefined;
  /** Callback to retry fetching the summary. */
  onRetry?: (() => void) | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom error content. */
  children?: ReactNode | undefined;
}

/** Props for CometChatConversationSummaryEmpty. */
export interface CometChatConversationSummaryEmptyProps {
  /** Custom empty message (overrides default localized text). */
  message?: string | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom empty content. */
  children?: ReactNode | undefined;
}

/** Context value shared between sub-components. */
export interface CometChatConversationSummaryContextValue {
  /** Current visual state. */
  state: CometChatConversationSummaryState;
  /** Fetched summary text (empty string if not loaded). */
  summary: string;
  /** Error object if state is 'error'. */
  error: Error | null;
  /** Callback when the close button is clicked. */
  onClose?: (() => void) | undefined;
  /** Retry fetching the summary. */
  retry: () => void;
}
