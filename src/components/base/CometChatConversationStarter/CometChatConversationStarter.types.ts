import type { ReactNode } from 'react';

/** Visual state of the conversation starter. */
export type CometChatConversationStarterState = 'loading' | 'loaded' | 'error' | 'empty';

/** Props for CometChatConversationStarterRoot. */
export interface CometChatConversationStarterRootProps {
  /** Async function that returns an array of suggestion strings. */
  getConversationStarters: () => Promise<string[]>;
  /** Callback when a suggestion is clicked. */
  onSuggestionClick?: ((suggestion: string) => void) | undefined;
  /** Optional custom className for the root container. */
  className?: string | undefined;
  /** Children — sub-components for custom composition. */
  children?: ReactNode | undefined;
}

/** Props for CometChatConversationStarterItem. */
export interface CometChatConversationStarterItemProps {
  /** The suggestion text to display. */
  suggestion: string;
  /** Callback when this suggestion is clicked. */
  onClick?: ((suggestion: string) => void) | undefined;
  /** Whether the item is disabled. */
  disabled?: boolean | undefined;
  /** Optional custom className. */
  className?: string | undefined;
}

/** Props for CometChatConversationStarterLoading. */
export interface CometChatConversationStarterLoadingProps {
  /** Number of shimmer items to display (default: 3). */
  count?: number | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom loading content. */
  children?: ReactNode | undefined;
}

/** Props for CometChatConversationStarterError. */
export interface CometChatConversationStarterErrorProps {
  /** Custom error message (overrides default localized text). */
  message?: string | undefined;
  /** Callback to retry fetching suggestions. */
  onRetry?: (() => void) | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom error content. */
  children?: ReactNode | undefined;
}

/** Props for CometChatConversationStarterEmpty. */
export interface CometChatConversationStarterEmptyProps {
  /** Custom empty message. */
  message?: string | undefined;
  /** Optional custom className. */
  className?: string | undefined;
  /** Custom empty content. */
  children?: ReactNode | undefined;
}

/** Context value shared between sub-components. */
export interface CometChatConversationStarterContextValue {
  /** Current visual state. */
  state: CometChatConversationStarterState;
  /** Fetched suggestions (empty array if not loaded). */
  suggestions: string[];
  /** Error object if state is 'error'. */
  error: Error | null;
  /** Callback when a suggestion is clicked. */
  onSuggestionClick?: ((suggestion: string) => void) | undefined;
  /** Retry fetching suggestions. */
  retry: () => void;
}
