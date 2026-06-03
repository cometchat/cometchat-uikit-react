import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';

// ==================== Selection Mode ====================

/** Selection mode for the user list. */
export type CometChatUsersSelectionMode = 'none' | 'single' | 'multiple';

// Re-export for convenience
export type { CometChatFetchState } from '../../types';

// ==================== User Option ====================

/** A single option in the user context menu (hover menu). */
export interface CometChatUserOption {
  /** Unique identifier. */
  id: string;
  /** Display title (localized). */
  title: string;
  /** Icon URL or inline SVG string. */
  iconURL?: string;
  /** Callback when the option is selected. */
  onClick: (user: CometChat.User) => void;
}

// ==================== Root Props ====================

/** Props for CometChatUsers.Root (Provider + default layout). */
export interface CometChatUsersRootProps {
  /** Custom request builder for fetching users. Defaults to limit 30. */
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  /** Custom request builder specifically for search queries. */
  searchRequestBuilder?: CometChat.UsersRequestBuilder;
  /** Initial search keyword to filter users. */
  searchKeyword?: string;
  /** Whether to hide user online/offline status indicator. */
  hideUserStatus?: boolean;
  /** Selection mode: 'none' | 'single' | 'multiple'. */
  selectionMode?: CometChatUsersSelectionMode;
  /** Currently active/highlighted user. */
  activeUser?: CometChat.User;
  /** Key to extract section header value from user object. */
  sectionHeaderKey?: keyof CometChat.User;
  /** Function that returns context menu options for a user. */
  options?: (user: CometChat.User) => CometChatUserOption[];
  /** Callback when a user item is clicked. */
  onItemClick?: (user: CometChat.User) => void;
  /** Callback when a user is selected or deselected. */
  onSelect?: (user: CometChat.User, selected: boolean) => void;
  /** Callback when an error occurs. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Callback when the user list is empty after initial fetch. */
  onEmpty?: () => void;
  /** Whether to hide the search bar. Default: false. */
  hideSearch?: boolean;
  /** Whether to show alphabetical section headers. Default: true. */
  showSectionHeader?: boolean;
  /** Whether to show a preview bar of selected users (chips) when selectionMode is 'multiple'. Default: false. */
  showSelectedUsersPreview?: boolean;
  /** Show the native scrollbar on the list. Default: false (scrollbar hidden). */
  showScrollbar?: boolean;
  /** Children (compound sub-components). If omitted, renders default layout. */
  children?: ReactNode;
}

// ==================== List Props ====================

/** Props for CometChatUsers.List. */
export interface CometChatUsersListProps {
  /** Optional custom render function for each user item. */
  itemView?: (user: CometChat.User) => ReactNode;
}

// ==================== Item Props ====================

/** Props for CometChatUsers.Item. */
export interface CometChatUsersItemProps {
  /** The user to render. */
  user: CometChat.User;
  /** Whether to hide the user status indicator. */
  hideUserStatus?: boolean;
  /** Whether this item is active/highlighted. */
  isActive?: boolean;
  /** Custom leading view (replaces avatar). */
  leadingView?: ReactNode;
  /** Custom title view. */
  titleView?: ReactNode;
  /** Custom subtitle view. */
  subtitleView?: ReactNode;
  /** Custom trailing view (replaces selection control). */
  trailingView?: ReactNode;
}

// ==================== Header Props ====================

/** Props for CometChatUsers.Header. */
export interface CometChatUsersHeaderProps {
  /** Custom title text. Defaults to localized "Users". */
  title?: string;
  /** Custom header content (replaces default). */
  children?: ReactNode;
}

// ==================== SearchBar Props ====================

/** Props for CometChatUsers.SearchBar. */
export interface CometChatUsersSearchBarProps {
  /** Placeholder text. Defaults to localized "Search users". */
  placeholder?: string;
}

// ==================== Section Header Props ====================

/** Props for CometChatUsers.SectionHeader. */
export interface CometChatUsersSectionHeaderProps {
  /** The section header character (e.g., "A", "B"). */
  letter: string;
}

// ==================== Empty State Props ====================

/** Props for CometChatUsers.EmptyState. */
export interface CometChatUsersEmptyStateProps {
  /** Custom empty state content (replaces default). */
  children?: ReactNode;
}

// ==================== Error State Props ====================

/** Props for CometChatUsers.ErrorState. */
export interface CometChatUsersErrorStateProps {
  /** Custom error state content (replaces default). */
  children?: ReactNode;
}

// ==================== Loading State Props ====================

/** Props for CometChatUsers.LoadingStateProps. */
export interface CometChatUsersLoadingStateProps {
  /** Custom loading state content (replaces default shimmer). */
  children?: ReactNode;
}

// ==================== Selected Preview Props ====================

/** Props for CometChatUsers.SelectedPreview. */
export interface CometChatUsersSelectedPreviewProps {
  /** Custom chip render function. */
  chipView?: (user: CometChat.User) => ReactNode;
}

// ==================== Context Value ====================

/** Context value provided by CometChatUsers.Root. */
export interface CometChatUsersContextValue {
  // --- State ---
  /** List of fetched users. */
  users: CometChat.User[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Error message (if fetchState is 'error'). */
  error: string | null;
  /** UIDs of selected users. */
  selectedUserIds: string[];
  /** Full user objects for selected users (persists across search). */
  selectedUsersMap: Map<string, CometChat.User>;
  /** Currently active/highlighted user UID. */
  activeUserId: string | null;
  /** Current search text. */
  searchText: string;

  // --- Configuration ---
  /** Selection mode. */
  selectionMode: CometChatUsersSelectionMode;
  /** Whether to hide user status. */
  hideUserStatus: boolean;
  /** Key for section header extraction. */
  sectionHeaderKey: keyof CometChat.User;
  /** Whether to hide the search bar. */
  hideSearch: boolean;
  /** Whether to show alphabetical section headers. */
  showSectionHeader: boolean;
  /** Whether to show a preview bar of selected users. */
  showSelectedUsersPreview: boolean;
  /** Whether to show the native scrollbar on the list. */
  showScrollbar: boolean;
  /** Context menu options function. */
  options?: ((user: CometChat.User) => CometChatUserOption[]) | undefined;

  // --- Actions ---
  /** Fetch next page of users. */
  fetchNext: () => Promise<void>;
  /** Set search text (triggers re-fetch). */
  setSearchText: (text: string) => void;
  /** Select a user. */
  selectUser: (user: CometChat.User) => void;
  /** Deselect a user by UID. */
  deselectUser: (userId: string) => void;
  /** Select a range of users (shift-click). */
  selectRange: (users: CometChat.User[]) => void;
  /** Deselect a range of users. */
  deselectRange: (userIds: string[]) => void;
  /** Clear all selections. */
  clearSelection: () => void;
  /** Set active user UID. */
  setActiveUser: (userId: string | null) => void;
  /** Handle item click (selection + callback). */
  handleItemClick: (user: CometChat.User, event?: { shiftKey?: boolean }) => void;
}

// ==================== Convenience Props (Flat API) ====================

/** Convenience view props for the direct `<CometChatUsers />` flat API. */
export interface CometChatUsersConvenienceProps {
  /** Custom leading view per user item (replaces avatar). */
  leadingView?: (user: CometChat.User) => ReactNode;
  /** Custom title view per user item. */
  titleView?: (user: CometChat.User) => ReactNode;
  /** Custom subtitle view per user item. */
  subtitleView?: (user: CometChat.User) => ReactNode;
  /** Custom trailing view per user item (replaces selection control). */
  trailingView?: (user: CometChat.User) => ReactNode;
  /** Fully custom item view (overrides leadingView, titleView, subtitleView, trailingView). */
  itemView?: (user: CometChat.User) => ReactNode;
  /** Custom header content (replaces default header). */
  headerView?: ReactNode;
  /** Custom loading state content (replaces default shimmer). */
  loadingView?: ReactNode;
  /** Custom error state content (replaces default error view). */
  errorView?: ReactNode;
  /** Custom empty state content (replaces default empty view). */
  emptyView?: ReactNode;
}

/**
 * Props for the direct `<CometChatUsers />` flat API.
 * Combines all Root props with convenience view props.
 * When using this API, do NOT pass `children` — the component renders its own default layout.
 */
export type CometChatUsersProps = Omit<CometChatUsersRootProps, 'children'> &
  CometChatUsersConvenienceProps;

// ==================== Hook Options & Return ====================

/** Options for the useCometChatUsers hook. */
export interface CometChatUseCometChatUsersOptions {
  usersRequestBuilder?: CometChat.UsersRequestBuilder | undefined;
  searchRequestBuilder?: CometChat.UsersRequestBuilder | undefined;
  searchKeyword?: string | undefined;
  hideUserStatus?: boolean | undefined;
  selectionMode?: CometChatUsersSelectionMode | undefined;
  activeUser?: CometChat.User | undefined;
  onError?: ((error: CometChat.CometChatException) => void) | null | undefined;
  onEmpty?: (() => void) | undefined;
  onSelect?: ((user: CometChat.User, selected: boolean) => void) | undefined;
  onItemClick?: ((user: CometChat.User) => void) | undefined;
}

/** Return type of the useCometChatUsers hook. */
export interface CometChatUseCometChatUsersReturn {
  // State
  users: CometChat.User[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  error: string | null;
  selectedUserIds: string[];
  selectedUsersMap: Map<string, CometChat.User>;
  activeUserId: string | null;
  searchText: string;
  // Actions
  fetchNext: () => Promise<void>;
  setSearchText: (text: string) => void;
  selectUser: (user: CometChat.User) => void;
  deselectUser: (userId: string) => void;
  selectRange: (users: CometChat.User[]) => void;
  deselectRange: (userIds: string[]) => void;
  clearSelection: () => void;
  setActiveUser: (userId: string | null) => void;
  handleItemClick: (user: CometChat.User, event?: { shiftKey?: boolean }) => void;
}
