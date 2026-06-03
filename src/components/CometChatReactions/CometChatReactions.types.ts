import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageBubbleAlignment } from '../../plugins/plugin.types';

/** Fetch lifecycle state for reactor list. */
export type CometChatReactionsFetchState = 'idle' | 'loading' | 'loaded' | 'error' | 'empty';

// --- Root ---

/** Props for CometChatReactions.Root. */
export interface CometChatReactionsRootProps {
  /** The message to show reactions for. Required. */
  message: CometChat.BaseMessage;
  /** Bubble alignment for positioning context. Default: 'left'. */
  alignment?: CometChatMessageBubbleAlignment;
  /** Custom reactions request builder for fetching reactor details. */
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  /** Called when a reaction chip is clicked (toggle). Parent handles SDK call. */
  onReactionClick?: (emoji: string, message: CometChat.BaseMessage) => void;
  /** Called when a user in the reaction list is clicked. */
  onReactorClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;
  /** Debounce time in ms before showing reaction info tooltip on hover. Default: 500. */
  hoverDebounceTime?: number;
  /** Error callback. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Children (sub-components). When omitted, renders default layout. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

// --- Bar ---

/** Props for CometChatReactions.Bar. */
export interface CometChatReactionsBarProps {
  /** Max visible reaction chips before overflow. Auto-calculated if not set. */
  maxVisible?: number;
  /** Optional custom className. */
  className?: string;
}

// --- Chip ---

/** Props for CometChatReactions.Chip. */
export interface CometChatReactionsChipProps {
  /** The reaction count object. */
  reaction: CometChat.ReactionCount;
  /** Optional custom className. */
  className?: string;
}

// --- Info (hover tooltip) ---

/** Props for CometChatReactions.Info. */
export interface CometChatReactionsInfoProps {
  /** The emoji to show info for. */
  emoji: string;
  /** Optional custom className. */
  className?: string;
}

// --- List (full reactor list in popover) ---

/** Props for CometChatReactions.List. */
export interface CometChatReactionsListProps {
  /** Optional custom className. */
  className?: string;
}

// --- Overflow ---

/** Props for CometChatReactions.Overflow. */
export interface CometChatReactionsOverflowProps {
  /** Number of hidden reactions. */
  count: number;
  /** Optional custom className. */
  className?: string;
}

// --- Context ---

/** Context value shared across CometChatReactions sub-components. */
export interface CometChatReactionsContextValue {
  /** The message object. */
  message: CometChat.BaseMessage;
  /** Reaction counts from the message. */
  reactions: CometChat.ReactionCount[];
  /** Bubble alignment. */
  alignment: CometChatMessageBubbleAlignment;
  /** Computed max visible chips. */
  maxVisible: number;
  /** Reactions visible in the bar (sliced). */
  visibleReactions: CometChat.ReactionCount[];
  /** Number of overflow reactions. */
  overflowCount: number;
  /** Active tab in the reactor list ('all' or emoji string). */
  activeTab: string;
  /** Reactor details for the active tab. */
  reactors: CometChat.Reaction[];
  /** Fetch state for reactor details. */
  reactorsFetchState: CometChatReactionsFetchState;
  /** Whether more reactors can be fetched. */
  reactorsHasMore: boolean;
  /** Toggle a reaction (fires parent callback). */
  onReactionClick: (emoji: string) => void;
  /** Click a reactor in the list. */
  onReactorClick: (reaction: CometChat.Reaction) => void;
  /** Switch the active tab in the reactor list. */
  setActiveTab: (tab: string) => void;
  /** Fetch reactors for the active tab. */
  fetchReactors: () => Promise<void>;
  /** Fetch next page of reactors. */
  fetchNextReactors: () => Promise<void>;
  /** Remove a reactor optimistically from the cached list. */
  removeReactor: (uid: string, emoji: string) => void;
  /** Request builder for reactor fetching. */
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  /** Debounce time in ms before showing reaction info tooltip on hover. */
  hoverDebounceTime: number;
  /** Error callback. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
}
