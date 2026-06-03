import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';

// ==================== Selection Mode ====================

/** Selection mode for the group members list. */
export type CometChatGroupMembersSelectionMode = 'none' | 'single' | 'multiple';

// Re-export for convenience
export type { CometChatFetchState } from '../../types';

// ==================== Group Member Option ====================

/** A single option in the group member context menu (hover menu). */
export interface CometChatGroupMemberOption {
  /** Unique identifier (e.g., 'kick', 'ban', 'changeScope'). */
  id: string;
  /** Display title (localized). */
  title: string;
  /** Icon URL or inline SVG string. */
  iconURL?: string;
  /** Callback when the option is selected. */
  onClick: (member: CometChat.GroupMember) => void;
}

// ==================== Root Props ====================

/** Props for CometChatGroupMembers.Root (Provider + default layout). */
export interface CometChatGroupMembersRootProps {
  /** The group whose members to display. Required. */
  group: CometChat.Group;
  /** Custom request builder for fetching group members. Defaults to limit 30. */
  groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  /** Custom request builder specifically for search queries. */
  searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  /** Initial search keyword to filter members. */
  searchKeyword?: string;
  /** Whether to hide user online/offline status indicator. */
  hideUserStatus?: boolean;
  /** Whether to hide the kick member option in the context menu. */
  hideKickMemberOption?: boolean;
  /** Whether to hide the ban member option in the context menu. */
  hideBanMemberOption?: boolean;
  /** Whether to hide the scope change option in the context menu. */
  hideScopeChangeOption?: boolean;
  /** Selection mode: 'none' | 'single' | 'multiple'. */
  selectionMode?: CometChatGroupMembersSelectionMode;
  /** Function that returns context menu options for a member. */
  options?: (member: CometChat.GroupMember) => CometChatGroupMemberOption[];
  /** Callback when a member item is clicked. */
  onItemClick?: (member: CometChat.GroupMember) => void;
  /** Callback when a member is selected or deselected. */
  onSelect?: (member: CometChat.GroupMember, selected: boolean) => void;
  /** Callback when an error occurs. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Callback when the member list is empty after initial fetch. */
  onEmpty?: () => void;
  /** Callback when back button is clicked. */
  onBack?: () => void;
  /** Whether to hide the search bar. Default: false. */
  hideSearch?: boolean;
  /** Show the native scrollbar on the list. Default: false (scrollbar hidden). */
  showScrollbar?: boolean;
  /** Children (compound sub-components). If omitted, renders default layout. */
  children?: ReactNode;
}

// ==================== List Props ====================

/** Props for CometChatGroupMembers.List. */
export interface CometChatGroupMembersListProps {
  /** Optional custom render function for each member item. */
  itemView?: (member: CometChat.GroupMember) => ReactNode;
}

// ==================== Item Props ====================

/** Props for CometChatGroupMembers.Item. */
export interface CometChatGroupMembersItemProps {
  /** The group member to render. */
  member: CometChat.GroupMember;
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
  /** Custom trailing view (replaces role badge + action menu). */
  trailingView?: ReactNode;
}

// ==================== Header Props ====================

/** Props for CometChatGroupMembers.Header. */
export interface CometChatGroupMembersHeaderProps {
  /** Custom title text. Defaults to "Members". */
  title?: string;
  /** Custom header content (replaces default). */
  children?: ReactNode;
}

// ==================== SearchBar Props ====================

/** Props for CometChatGroupMembers.SearchBar. */
export interface CometChatGroupMembersSearchBarProps {
  /** Placeholder text. Defaults to "Search members". */
  placeholder?: string;
}

// ==================== Empty State Props ====================

/** Props for CometChatGroupMembers.EmptyState. */
export interface CometChatGroupMembersEmptyStateProps {
  /** Custom empty state content (replaces default). */
  children?: ReactNode;
}

// ==================== Error State Props ====================

/** Props for CometChatGroupMembers.ErrorState. */
export interface CometChatGroupMembersErrorStateProps {
  /** Custom error state content (replaces default). */
  children?: ReactNode;
}

// ==================== Loading State Props ====================

/** Props for CometChatGroupMembers.LoadingState. */
export interface CometChatGroupMembersLoadingStateProps {
  /** Custom loading state content (replaces default shimmer). */
  children?: ReactNode;
}

// ==================== Context Value ====================

/** Context value provided by CometChatGroupMembers.Root. */
export interface CometChatGroupMembersContextValue {
  // --- State ---
  /** The group whose members are displayed. */
  group: CometChat.Group;
  /** List of fetched group members. */
  members: CometChat.GroupMember[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Error message (if fetchState is 'error'). */
  error: string | null;
  /** UIDs of selected members. */
  selectedMemberIds: string[];
  /** Full member objects for selected members (persists across search). */
  selectedMembersMap: Map<string, CometChat.GroupMember>;
  /** Currently active/highlighted member UID. */
  activeMemberId: string | null;
  /** Current search text. */
  searchText: string;
  /** The logged-in user (for role-based action visibility). */
  loggedInUser: CometChat.User | null;
  /** The logged-in user's scope in this group. */
  loggedInUserScope: string | null;

  // --- Configuration ---
  /** Selection mode. */
  selectionMode: CometChatGroupMembersSelectionMode;
  /** Whether to hide user status. */
  hideUserStatus: boolean;
  /** Whether to hide the search bar. */
  hideSearch: boolean;
  /** Whether to hide the kick member option. */
  hideKickMemberOption: boolean;
  /** Whether to hide the ban member option. */
  hideBanMemberOption: boolean;
  /** Whether to hide the scope change option. */
  hideScopeChangeOption: boolean;
  /** Context menu options function. */
  options?: ((member: CometChat.GroupMember) => CometChatGroupMemberOption[]) | undefined;

  // --- Actions ---
  /** Fetch next page of members. */
  fetchNext: () => Promise<void>;
  /** Set search text (triggers re-fetch). */
  setSearchText: (text: string) => void;
  /** Select a member. */
  selectMember: (member: CometChat.GroupMember) => void;
  /** Deselect a member by UID. */
  deselectMember: (uid: string) => void;
  /** Clear all selections. */
  clearSelection: () => void;
  /** Set active member UID. */
  setActiveMember: (uid: string | null) => void;
  /** Handle item click (selection + callback). */
  handleItemClick: (member: CometChat.GroupMember, event?: { shiftKey?: boolean }) => void;
  /** Kick a member from the group. */
  kickMember: (uid: string) => Promise<boolean>;
  /** Ban a member from the group. */
  banMember: (uid: string) => Promise<boolean>;
  /** Unban a previously banned member. */
  unbanMember: (uid: string) => Promise<boolean>;
  /** Change a member's role/scope. */
  changeScope: (uid: string, scope: string) => Promise<boolean>;
  /** Set the member to change scope of (opens CometChatChangeScope dialog). */
  setMemberToChangeScope: (member: CometChat.GroupMember | null) => void;
  /** The member currently pending scope change (for dialog display). */
  memberToChangeScope: CometChat.GroupMember | null;
}

// ==================== Convenience Props (Flat API) ====================

/** Convenience view props for the direct `<CometChatGroupMembers />` flat API. */
export interface CometChatGroupMembersConvenienceProps {
  /** Custom leading view per member item (replaces avatar). */
  leadingView?: (member: CometChat.GroupMember) => ReactNode;
  /** Custom title view per member item. */
  titleView?: (member: CometChat.GroupMember) => ReactNode;
  /** Custom subtitle view per member item. */
  subtitleView?: (member: CometChat.GroupMember) => ReactNode;
  /** Custom trailing view per member item (replaces role badge + action menu). */
  trailingView?: (member: CometChat.GroupMember) => ReactNode;
  /** Fully custom item view (overrides leadingView, titleView, subtitleView, trailingView). */
  itemView?: (member: CometChat.GroupMember) => ReactNode;
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
 * Props for the direct `<CometChatGroupMembers />` flat API.
 * Combines all Root props with convenience view props.
 */
export type CometChatGroupMembersProps = Omit<CometChatGroupMembersRootProps, 'children'> &
  CometChatGroupMembersConvenienceProps;

// ==================== Hook Options & Return ====================

/** Options for the useCometChatGroupMembers hook. */
export interface CometChatUseCometChatGroupMembersOptions {
  group: CometChat.Group;
  groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder | undefined;
  searchRequestBuilder?: CometChat.GroupMembersRequestBuilder | undefined;
  searchKeyword?: string | undefined;
  hideUserStatus?: boolean | undefined;
  selectionMode?: CometChatGroupMembersSelectionMode | undefined;
  onError?: ((error: CometChat.CometChatException) => void) | null | undefined;
  onEmpty?: (() => void) | undefined;
  onSelect?: ((member: CometChat.GroupMember, selected: boolean) => void) | undefined;
  onItemClick?: ((member: CometChat.GroupMember) => void) | undefined;
}

/** Return type of the useCometChatGroupMembers hook. */
export interface CometChatUseCometChatGroupMembersReturn {
  // State
  members: CometChat.GroupMember[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  error: string | null;
  selectedMemberIds: string[];
  selectedMembersMap: Map<string, CometChat.GroupMember>;
  activeMemberId: string | null;
  searchText: string;
  loggedInUser: CometChat.User | null;
  loggedInUserScope: string | null;
  // Actions
  fetchNext: () => Promise<void>;
  setSearchText: (text: string) => void;
  selectMember: (member: CometChat.GroupMember) => void;
  deselectMember: (uid: string) => void;
  clearSelection: () => void;
  setActiveMember: (uid: string | null) => void;
  handleItemClick: (member: CometChat.GroupMember, event?: { shiftKey?: boolean }) => void;
  kickMember: (uid: string) => Promise<boolean>;
  banMember: (uid: string) => Promise<boolean>;
  unbanMember: (uid: string) => Promise<boolean>;
  changeScope: (uid: string, scope: string) => Promise<boolean>;
  setMemberToChangeScope: (member: CometChat.GroupMember | null) => void;
  memberToChangeScope: CometChat.GroupMember | null;
}
