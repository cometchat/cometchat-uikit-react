import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { ReactNode } from 'react';

/** Fetch lifecycle state for the reaction list. */
export type CometChatReactionListFetchState = 'idle' | 'loading' | 'loaded' | 'error' | 'empty';

// --- Root ---

/** Props for CometChatReactionList.Root (and the flat API). */
export interface CometChatReactionListRootProps {
  /** The message to show reactions for. Required. */
  message: CometChat.BaseMessage;
  /** Custom reactions request builder. */
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  /** Called when a reaction item is clicked (current user only — to remove). */
  onItemClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;
  /** Called when all reactions are removed (parent should close the panel). */
  onEmpty?: () => void;
  /** Error callback. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Children for compound composition. */
  children?: ReactNode;
  /** Optional className. */
  className?: string;
}

// --- Context ---

/** Context value shared across CometChatReactionList sub-components. */
export interface CometChatReactionListContextValue {
  /** The message object. */
  message: CometChat.BaseMessage;
  /** All reactions fetched so far (flat list). */
  allReactions: CometChat.Reaction[];
  /** Reactions grouped by emoji. */
  groupedReactions: Map<string, CometChat.Reaction[]>;
  /** Currently selected emoji filter. null = "All". */
  selectedEmoji: string | null;
  /** Fetch state. */
  fetchState: CometChatReactionListFetchState;
  /** Whether more reactions can be fetched. */
  hasMore: boolean;
  /** Whether a fetch is in progress. */
  isFetching: boolean;
  /** Unique emoji tabs derived from groupedReactions. */
  emojiTabs: string[];
  /** Total reaction count (sum of all). */
  totalCount: number;
  /** Reactions currently displayed (filtered by selectedEmoji). */
  filteredReactions: CometChat.Reaction[];
  /** Select an emoji tab (null = All). */
  selectEmoji: (emoji: string | null) => void;
  /** Fetch more reactions (pagination). */
  fetchMore: () => Promise<void>;
  /** Handle item click (current user only). */
  handleItemClick: (reaction: CometChat.Reaction) => void;
  /** Whether a reaction is from the current user. */
  isCurrentUser: (reaction: CometChat.Reaction) => boolean;
  /** Retry after error. */
  retry: () => void;
  /** Logged-in user UID. */
  loggedInUserUid: string;
}

// --- Sub-component props ---

/** Props for CometChatReactionList.Tabs. */
export interface CometChatReactionListTabsProps {
  className?: string;
}

/** Props for CometChatReactionList.Items. */
export interface CometChatReactionListItemsProps {
  className?: string;
}

/** Props for CometChatReactionList.LoadingState. */
export interface CometChatReactionListLoadingStateProps {
  className?: string;
}

/** Props for CometChatReactionList.ErrorState. */
export interface CometChatReactionListErrorStateProps {
  className?: string;
}

/** Props for CometChatReactionList.EmptyState. */
export interface CometChatReactionListEmptyStateProps {
  className?: string;
}
