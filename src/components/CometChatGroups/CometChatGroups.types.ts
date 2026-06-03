import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';

// ==================== Selection Mode ====================

/** Selection mode for the group list. */
export type CometChatGroupsSelectionMode = 'none' | 'single' | 'multiple';

// Re-export for convenience
export type { CometChatFetchState } from '../../types';

// ==================== Group Option ====================

/** A single option in the group context menu (hover menu). */
export interface CometChatGroupOption {
  /** Unique identifier. */
  id: string;
  /** Display title (localized). */
  title: string;
  /** Icon URL or inline SVG string. */
  iconURL?: string;
  /** Callback when the option is selected. */
  onClick: (group: CometChat.Group) => void;
}

// ==================== Root Props ====================

/** Props for CometChatGroups.Root (Provider + default layout). */
export interface CometChatGroupsRootProps {
  /** Custom request builder for fetching groups. Defaults to limit 30. */
  groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
  /** Custom request builder specifically for search queries. */
  searchRequestBuilder?: CometChat.GroupsRequestBuilder;
  /** Initial search keyword to filter groups. */
  searchKeyword?: string;
  /** Whether to hide the group type badge (public/private/password). */
  hideGroupType?: boolean;
  /** Selection mode: 'none' | 'single' | 'multiple'. */
  selectionMode?: CometChatGroupsSelectionMode;
  /** Currently active/highlighted group. */
  activeGroup?: CometChat.Group;
  /** Function that returns context menu options for a group. */
  options?: (group: CometChat.Group) => CometChatGroupOption[];
  /** Callback when a group item is clicked. */
  onItemClick?: (group: CometChat.Group) => void;
  /** Callback when a group is selected or deselected. */
  onSelect?: (group: CometChat.Group, selected: boolean) => void;
  /** Callback when an error occurs. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Callback when the group list is empty after initial fetch. */
  onEmpty?: () => void;
  /** Whether to hide the search bar. Default: false. */
  hideSearch?: boolean;
  /** Show the native scrollbar on the list. Default: false (scrollbar hidden). */
  showScrollbar?: boolean;
  /** Children (compound sub-components). If omitted, renders default layout. */
  children?: ReactNode;
}

// ==================== List Props ====================

/** Props for CometChatGroups.List. */
export interface CometChatGroupsListProps {
  /** Optional custom render function for each group item. */
  itemView?: (group: CometChat.Group) => ReactNode;
}

// ==================== Item Props ====================

/** Props for CometChatGroups.Item. */
export interface CometChatGroupsItemProps {
  /** The group to render. */
  group: CometChat.Group;
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

/** Props for CometChatGroups.Header. */
export interface CometChatGroupsHeaderProps {
  /** Custom title text. Defaults to "Groups". */
  title?: string;
  /** Custom header content (replaces default). */
  children?: ReactNode;
}

// ==================== SearchBar Props ====================

/** Props for CometChatGroups.SearchBar. */
export interface CometChatGroupsSearchBarProps {
  /** Placeholder text. Defaults to "Search groups". */
  placeholder?: string;
}

// ==================== Empty State Props ====================

/** Props for CometChatGroups.EmptyState. */
export interface CometChatGroupsEmptyStateProps {
  /** Custom empty state content (replaces default). */
  children?: ReactNode;
}

// ==================== Error State Props ====================

/** Props for CometChatGroups.ErrorState. */
export interface CometChatGroupsErrorStateProps {
  /** Custom error state content (replaces default). */
  children?: ReactNode;
}

// ==================== Loading State Props ====================

/** Props for CometChatGroups.LoadingState. */
export interface CometChatGroupsLoadingStateProps {
  /** Custom loading state content (replaces default shimmer). */
  children?: ReactNode;
}

// ==================== Context Value ====================

/** Context value provided by CometChatGroups.Root. */
export interface CometChatGroupsContextValue {
  // --- State ---
  /** List of fetched groups. */
  groups: CometChat.Group[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Error message (if fetchState is 'error'). */
  error: string | null;
  /** GUIDs of selected groups. */
  selectedGroupIds: string[];
  /** Full group objects for selected groups (persists across search). */
  selectedGroupsMap: Map<string, CometChat.Group>;
  /** Currently active/highlighted group GUID. */
  activeGroupId: string | null;
  /** Current search text. */
  searchText: string;

  // --- Configuration ---
  /** Selection mode. */
  selectionMode: CometChatGroupsSelectionMode;
  /** Whether to hide the group type badge. */
  hideGroupType: boolean;
  /** Whether to hide the search bar. */
  hideSearch: boolean;
  /** Context menu options function. */
  options?: ((group: CometChat.Group) => CometChatGroupOption[]) | undefined;

  // --- Actions ---
  /** Fetch next page of groups. */
  fetchNext: () => Promise<void>;
  /** Set search text (triggers re-fetch). */
  setSearchText: (text: string) => void;
  /** Select a group. */
  selectGroup: (group: CometChat.Group) => void;
  /** Deselect a group by GUID. */
  deselectGroup: (groupId: string) => void;
  /** Select a range of groups (shift-click). */
  selectRange: (groups: CometChat.Group[]) => void;
  /** Deselect a range of groups. */
  deselectRange: (groupIds: string[]) => void;
  /** Clear all selections. */
  clearSelection: () => void;
  /** Set active group GUID. */
  setActiveGroup: (groupId: string | null) => void;
  /** Handle item click (selection + callback). */
  handleItemClick: (group: CometChat.Group, event?: { shiftKey?: boolean }) => void;
  /** Create a new group. */
  createGroup: (group: CometChat.Group) => Promise<CometChat.Group>;
  /** Join a group (with optional password for password-protected groups). */
  joinGroup: (guid: string, groupType: string, password?: string) => Promise<CometChat.Group>;
  /** Leave a group. */
  leaveGroup: (guid: string) => Promise<boolean>;
  /** Delete a group (owner only). */
  deleteGroup: (guid: string) => Promise<boolean>;
}

// ==================== Convenience Props (Flat API) ====================

/** Convenience view props for the direct `<CometChatGroups />` flat API. */
export interface CometChatGroupsConvenienceProps {
  /** Custom leading view per group item (replaces avatar). */
  leadingView?: (group: CometChat.Group) => ReactNode;
  /** Custom title view per group item. */
  titleView?: (group: CometChat.Group) => ReactNode;
  /** Custom subtitle view per group item. */
  subtitleView?: (group: CometChat.Group) => ReactNode;
  /** Custom trailing view per group item (replaces selection control). */
  trailingView?: (group: CometChat.Group) => ReactNode;
  /** Fully custom item view (overrides leadingView, titleView, subtitleView, trailingView). */
  itemView?: (group: CometChat.Group) => ReactNode;
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
 * Props for the direct `<CometChatGroups />` flat API.
 * Combines all Root props with convenience view props.
 */
export type CometChatGroupsProps = Omit<CometChatGroupsRootProps, 'children'> &
  CometChatGroupsConvenienceProps;

// ==================== Hook Options & Return ====================

/** Options for the useCometChatGroups hook. */
export interface CometChatUseCometChatGroupsOptions {
  groupsRequestBuilder?: CometChat.GroupsRequestBuilder | undefined;
  searchRequestBuilder?: CometChat.GroupsRequestBuilder | undefined;
  searchKeyword?: string | undefined;
  selectionMode?: CometChatGroupsSelectionMode | undefined;
  activeGroup?: CometChat.Group | undefined;
  onError?: ((error: CometChat.CometChatException) => void) | null | undefined;
  onEmpty?: (() => void) | undefined;
  onSelect?: ((group: CometChat.Group, selected: boolean) => void) | undefined;
  onItemClick?: ((group: CometChat.Group) => void) | undefined;
}

/** Return type of the useCometChatGroups hook. */
export interface CometChatUseCometChatGroupsReturn {
  // State
  groups: CometChat.Group[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  error: string | null;
  selectedGroupIds: string[];
  selectedGroupsMap: Map<string, CometChat.Group>;
  activeGroupId: string | null;
  searchText: string;
  // Actions
  fetchNext: () => Promise<void>;
  setSearchText: (text: string) => void;
  selectGroup: (group: CometChat.Group) => void;
  deselectGroup: (groupId: string) => void;
  selectRange: (groups: CometChat.Group[]) => void;
  deselectRange: (groupIds: string[]) => void;
  clearSelection: () => void;
  setActiveGroup: (groupId: string | null) => void;
  handleItemClick: (group: CometChat.Group, event?: { shiftKey?: boolean }) => void;
  createGroup: (group: CometChat.Group) => Promise<CometChat.Group>;
  joinGroup: (guid: string, groupType: string, password?: string) => Promise<CometChat.Group>;
  leaveGroup: (guid: string) => Promise<boolean>;
  deleteGroup: (guid: string) => Promise<boolean>;
}
