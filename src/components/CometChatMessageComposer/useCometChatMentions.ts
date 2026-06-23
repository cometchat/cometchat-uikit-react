/**
 * useCometChatMentions — hook for mention state management in the message composer.
 *
 * Handles:
 * - Detecting @ trigger from the editor callbacks
 * - Managing open/close state and search keyword
 * - Tracking mentioned users for the message
 * - Inserting the selected mention into the editor
 * - @all mention support in groups
 *
 * NOTE: Suggestion fetching and pagination are delegated to CometChatUsers /
 * CometChatGroupMembers components rendered by CometChatMessageComposerMentionsList.
 * This hook no longer fetches suggestions directly.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';

export interface MentionSuggestion {
  uid: string;
  name: string;
  avatar?: string;
  /** Whether this is the @all mention. */
  isAllMention?: boolean;
}

export interface UseCometChatMentionsOptions {
  /** Whether individual member mentions are disabled. */
  disableMentions?: boolean;
  /** Whether @all mention is disabled. */
  disableMentionAll?: boolean;
  /** Label for the @all mention. Default: 'all'. */
  mentionAllLabel?: string;
  /** Group (needed for group member search and @all). */
  group?: CometChat.Group;
  /** User (for 1:1 chats — searches all users). */
  user?: CometChat.User;
  /** Custom users request builder for mention search. */
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  /** Custom group members request builder for mention search. */
  groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  /** Callback to insert the mention into the editor. */
  onInsertMention: (uid: string, label: string, charsToDelete: number, isSelf?: boolean) => void;
  /** The currently logged-in user (for self-mention detection). */
  loggedInUser?: CometChat.User | null;
  /** Called when a mention is selected from the suggestions list. */
  onMentionSelected?: (user: CometChat.User | CometChat.GroupMember) => void;
}

export interface UseCometChatMentionsReturn {
  /** Whether the mentions dropdown is open. */
  isOpen: boolean;
  /** Current search keyword (text after @). */
  searchKeyword: string;
  /** Called by the editor when @ is detected. */
  handleMentionStart: (query: string) => void;
  /** Called by the editor when mention context is lost. */
  handleMentionEnd: () => void;
  /** Called when a user/member is selected from the list. */
  handleItemClick: (item: CometChat.User | CometChat.GroupMember | null) => void;
  /** Called when the mentions list is empty (no results). */
  handleEmpty: () => void;
  /** Keyboard handler — attach to the editor's keydown for Escape. */
  handleKeyDown: (e: KeyboardEvent) => boolean;
  /** Get the list of mentioned users in the current message (uid + name). */
  getMentionedUsers: () => { uid: string; name: string }[];
  /** Clear the mentioned users list (call after send). */
  clearMentionedUsers: () => void;
  /** Seed the mentioned users list with pre-existing mentions (used when entering edit mode). */
  seedMentionedUsers: (users: { uid: string; name: string }[]) => void;
}

export function useCometChatMentions(
  options: UseCometChatMentionsOptions
): UseCometChatMentionsReturn {
  const {
    disableMentions = false,
    disableMentionAll = false,
    mentionAllLabel = 'all',
    group,
    user,
    onInsertMention,
    loggedInUser,
    onMentionSelected,
  } = options;

  const isMentionsCompletelyDisabled = disableMentions && (disableMentionAll || !group);

  const [isOpen, setIsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const charsToDeleteRef = useRef(0);

  // Accumulates mentioned users in the current message (cleared after send)
  const mentionedUsersRef = useRef<Map<string, { uid: string; name: string }>>(new Map());

  // Close mentions list when conversation changes (group or user prop changes)
  const prevGroupRef = useRef(group);
  const prevUserRef = useRef(user);
  useEffect(() => {
    const groupChanged = group !== prevGroupRef.current;
    const userChanged = user !== prevUserRef.current;
    prevGroupRef.current = group;
    prevUserRef.current = user;

    if (groupChanged || userChanged) {
      setIsOpen(false);
      setSearchKeyword('');
    }
  }, [group, user]);

  // --- Handlers ---

  const handleMentionStart = useCallback(
    (query: string) => {
      if (isMentionsCompletelyDisabled) return;

      // +1 for the @ character itself
      charsToDeleteRef.current = query.length + 1;

      setSearchKeyword(query);
      setIsOpen(true);
    },
    [isMentionsCompletelyDisabled]
  );

  const handleMentionEnd = useCallback(() => {
    setIsOpen(false);
    setSearchKeyword('');
  }, []);

  /** Called when a user/member is selected from the CometChatUsers/CometChatGroupMembers list. */
  const handleItemClick = useCallback(
    (item: CometChat.User | CometChat.GroupMember | null) => {
      if (item === null) {
        // @all mention
        const label = mentionAllLabel;
        onInsertMention('all', label, charsToDeleteRef.current, true);
        mentionedUsersRef.current.set('all', { uid: 'all', name: label });
      } else {
        const uid = item.getUid();
        const name = item.getName();
        const isSelf = uid === loggedInUser?.getUid();

        onInsertMention(uid, name, charsToDeleteRef.current, isSelf);
        mentionedUsersRef.current.set(uid, { uid, name });

        // Fire onMentionSelected callback
        if (onMentionSelected) {
          onMentionSelected(item);
        }
      }

      setIsOpen(false);
      setSearchKeyword('');
    },
    [onInsertMention, onMentionSelected, loggedInUser, mentionAllLabel]
  );

  /** Called when the mentions list is empty — close the dropdown. */
  const handleEmpty = useCallback(() => {
    setIsOpen(false);
    setSearchKeyword('');
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      if (!isOpen) return false;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleMentionEnd();
        return true;
      }

      return false;
    },
    [isOpen, handleMentionEnd]
  );

  /** Get the list of mentioned users in the current message. */
  const getMentionedUsers = useCallback(() => {
    return Array.from(mentionedUsersRef.current.values());
  }, []);

  /** Clear the mentioned users list (call after send). */
  const clearMentionedUsers = useCallback(() => {
    mentionedUsersRef.current.clear();
  }, []);

  /** Seed the mentioned users list with pre-existing mentions (used when entering edit mode). */
  const seedMentionedUsers = useCallback((users: { uid: string; name: string }[]) => {
    mentionedUsersRef.current.clear();
    for (const u of users) {
      mentionedUsersRef.current.set(u.uid, u);
    }
  }, []);

  return {
    isOpen,
    searchKeyword,
    handleMentionStart,
    handleMentionEnd,
    handleItemClick,
    handleEmpty,
    handleKeyDown,
    getMentionedUsers,
    clearMentionedUsers,
    seedMentionedUsers,
  };
}
