import type { ReactNode } from 'react';

/** Visual state of the smart replies panel. */
export type CometChatSmartRepliesState = 'loading' | 'loaded' | 'error' | 'empty';

/** Props for CometChatSmartRepliesRoot. */
export interface CometChatSmartRepliesRootProps {
  /** Async function that returns an array of reply suggestion strings. */
  getSmartReplies: () => Promise<string[]>;
  /** Callback when a suggestion is clicked. Receives the reply string. */
  onSuggestionClick?: ((reply: string) => void) | undefined;
  /** Callback when the close button is clicked. */
  onClose?: (() => void) | undefined;
  /** Optional custom className for the root container. */
  className?: string | undefined;
  /** Children — sub-components for custom composition. */
  children?: ReactNode | undefined;
}

/** Props for CometChatSmartRepliesHeader. */
export interface CometChatSmartRepliesHeaderProps {
  /** Custom title text (overrides default localized text). */
  title?: string | undefined;
  /** Whether to show the close button (default: true). */
  showCloseButton?: boolean | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom header content. */
  children?: ReactNode | undefined;
}

/** Props for CometChatSmartRepliesItem. */
export interface CometChatSmartRepliesItemProps {
  /** The reply text to display. */
  reply: string;
  /** Optional custom className. */
  className?: string | undefined;
}

/** Props for CometChatSmartRepliesLoading. */
export interface CometChatSmartRepliesLoadingProps {
  /** Number of shimmer bars to display (default: 3). */
  count?: number | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom loading content. */
  children?: ReactNode | undefined;
}

/** Props for CometChatSmartRepliesError. */
export interface CometChatSmartRepliesErrorProps {
  /** Custom error message (overrides default localized text). */
  message?: string | undefined;
  /** Callback to retry fetching replies. */
  onRetry?: (() => void) | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom error content. */
  children?: ReactNode | undefined;
}

/** Props for CometChatSmartRepliesEmpty. */
export interface CometChatSmartRepliesEmptyProps {
  /** Custom empty message (overrides default localized text). */
  message?: string | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom empty content. */
  children?: ReactNode | undefined;
}

/** Context value shared between sub-components. */
export interface CometChatSmartRepliesContextValue {
  /** Current visual state. */
  state: CometChatSmartRepliesState;
  /** Fetched reply suggestions (empty array if not loaded). */
  replies: string[];
  /** Error object if state is 'error'. */
  error: Error | null;
  /** Callback when a suggestion is clicked. */
  onSuggestionClick?: ((reply: string) => void) | undefined;
  /** Callback when the close button is clicked. */
  onClose?: (() => void) | undefined;
  /** Retry fetching the replies. */
  retry: () => void;
}
