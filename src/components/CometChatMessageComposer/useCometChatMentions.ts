/**
 * useCometChatMentions — hook for mention suggestions in the message composer.
 *
 * Handles:
 * - Detecting @ trigger from the RichTextEditor callbacks
 * - Fetching user/group member suggestions via SDK
 * - Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
 * - Inserting the selected mention into the editor
 * - @all mention support in groups
 *
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';

const MENTION_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;

export interface MentionSuggestion {
  uid: string;
  name: string;
  avatar?: string;
  /** Whether this is the @all mention. */
  isAllMention?: boolean;
}

export interface UseCometChatMentionsOptions {
  /** Whether mentions are disabled entirely. */
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
  /** Whether the suggestions dropdown is open. */
  isOpen: boolean;
  /** Current list of suggestions. */
  suggestions: MentionSuggestion[];
  /** Index of the focused suggestion (for keyboard nav). */
  focusedIndex: number;
  /** Whether suggestions are loading. */
  isLoading: boolean;
  /** Called by the editor when @ is detected. */
  handleMentionStart: (query: string) => void;
  /** Called by the editor when mention context is lost. */
  handleMentionEnd: () => void;
  /** Called when a suggestion is clicked. */
  handleSelect: (suggestion: MentionSuggestion) => void;
  /** Keyboard handler — attach to the editor's keydown for ArrowUp/Down/Enter/Escape. */
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
    usersRequestBuilder,
    groupMembersRequestBuilder,
    onInsertMention,
    loggedInUser,
    onMentionSelected,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const queryRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charsToDeleteRef = useRef(0);
  // Incremented on conversation change to invalidate in-flight fetches
  const fetchGenerationRef = useRef(0);
  // Map uid → full SDK object for onMentionSelected callback
  const sdkObjectsRef = useRef<Map<string, CometChat.User | CometChat.GroupMember>>(new Map());
  // Accumulates mentioned users in the current message (cleared after send)
  const mentionedUsersRef = useRef<Map<string, { uid: string; name: string }>>(new Map());

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close mentions list when conversation changes (group or user prop changes)
  const prevGroupRef = useRef(group);
  const prevUserRef = useRef(user);
  useEffect(() => {
    const groupChanged = group !== prevGroupRef.current;
    const userChanged = user !== prevUserRef.current;
    prevGroupRef.current = group;
    prevUserRef.current = user;

    if (groupChanged || userChanged) {
      // Increment generation to invalidate any in-flight fetch
      fetchGenerationRef.current += 1;
      setIsOpen(false);
      setSuggestions([]);
      setFocusedIndex(0);
      setIsLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [group, user]);

  // --- Fetch suggestions ---
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (disableMentions) return;

      // Capture the current generation to detect stale fetches
      const generation = fetchGenerationRef.current;

      setIsLoading(true);
      const results: MentionSuggestion[] = [];

      try {
        // Add @all if applicable (group chat, not disabled, matches query)
        if (
          group &&
          !disableMentionAll &&
          mentionAllLabel.toLowerCase().startsWith(query.toLowerCase())
        ) {
          results.push({
            uid: 'all',
            name: mentionAllLabel,
            isAllMention: true,
          });
        }

        // Fetch from SDK
        if (CometChat.isInitialized()) {
          // Ensure we have a logged-in user before making SDK calls
          const currentUser = await CometChat.getLoggedinUser();
          if (generation !== fetchGenerationRef.current) return; // stale

          if (!currentUser) {
            console.warn('[CometChat Mentions] No logged-in user, skipping fetch');
            if (generation !== fetchGenerationRef.current) return;
            setSuggestions(results);
            setFocusedIndex(0);
            setIsLoading(false);
            setIsOpen(results.length > 0);
            return;
          }

          if (group) {
            const request = groupMembersRequestBuilder
              ? groupMembersRequestBuilder.setSearchKeyword(query).build()
              : new CometChat.GroupMembersRequestBuilder(group.getGuid())
                  .setLimit(MENTION_LIMIT)
                  .setSearchKeyword(query)
                  .build();
            const members = await request.fetchNext();
            if (generation !== fetchGenerationRef.current) return; // stale
            for (const member of members) {
              if (member.getUid() !== loggedInUser?.getUid()) {
                results.push({
                  uid: member.getUid(),
                  name: member.getName(),
                  avatar: member.getAvatar(),
                });
                sdkObjectsRef.current.set(member.getUid(), member);
              }
            }
          } else {
            const request = usersRequestBuilder
              ? usersRequestBuilder.setSearchKeyword(query).build()
              : new CometChat.UsersRequestBuilder()
                  .setLimit(MENTION_LIMIT)
                  .setSearchKeyword(query)
                  .build();
            const users = await request.fetchNext();
            if (generation !== fetchGenerationRef.current) return; // stale
            for (const u of users) {
              results.push({
                uid: u.getUid(),
                name: u.getName(),
                avatar: u.getAvatar(),
              });
              sdkObjectsRef.current.set(u.getUid(), u);
            }
          }
        } else {
          console.warn(
            '[CometChat Mentions] SDK not initialized, cannot fetch mention suggestions'
          );
        }
      } catch (error) {
        console.warn('[CometChat Mentions] Error fetching suggestions:', error);
      }

      // Final stale check before updating state
      if (generation !== fetchGenerationRef.current) return;

      console.log('[CometChat Mentions] Query:', query, '| Results:', results.length, results);
      setSuggestions(results);
      setFocusedIndex(0);
      setIsLoading(false);
      setIsOpen(results.length > 0);
    },
    [
      disableMentions,
      disableMentionAll,
      mentionAllLabel,
      group,
      loggedInUser,
      usersRequestBuilder,
      groupMembersRequestBuilder,
    ]
  );

  // --- Handlers ---

  const handleMentionStart = useCallback(
    (query: string) => {
      if (disableMentions) return;

      console.log('[CometChat Mentions] @ detected, query:', JSON.stringify(query));
      queryRef.current = query;
      // +1 for the @ character itself
      charsToDeleteRef.current = query.length + 1;

      // Show the dropdown immediately (loading state)
      setIsOpen(true);
      setIsLoading(true);

      // Debounce the search
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchSuggestions(query);
      }, SEARCH_DEBOUNCE_MS);
    },
    [disableMentions, fetchSuggestions]
  );

  const handleMentionEnd = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
    setFocusedIndex(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleSelect = useCallback(
    (suggestion: MentionSuggestion) => {
      const isSelf =
        (suggestion.isAllMention ?? false) || suggestion.uid === loggedInUser?.getUid();

      onInsertMention(suggestion.uid, suggestion.name, charsToDeleteRef.current, isSelf);

      // Track this mention for setMentionedUsers on the message
      mentionedUsersRef.current.set(suggestion.uid, { uid: suggestion.uid, name: suggestion.name });

      // Fire onMentionSelected with the full SDK object if available
      if (onMentionSelected && !suggestion.isAllMention) {
        const sdkObj = sdkObjectsRef.current.get(suggestion.uid);
        if (sdkObj) {
          onMentionSelected(sdkObj);
        }
      }

      setIsOpen(false);
      setSuggestions([]);
      setFocusedIndex(0);
    },
    [onInsertMention, onMentionSelected, loggedInUser]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      if (!isOpen || suggestions.length === 0) return false;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => (prev + 1) % suggestions.length);
          return true;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          return true;

        case 'Enter':
          e.preventDefault();
          if (suggestions[focusedIndex]) {
            handleSelect(suggestions[focusedIndex]);
          }
          return true;

        case 'Escape':
          e.preventDefault();
          handleMentionEnd();
          return true;

        default:
          return false;
      }
    },
    [isOpen, suggestions, focusedIndex, handleSelect, handleMentionEnd]
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
    suggestions,
    focusedIndex,
    isLoading,
    handleMentionStart,
    handleMentionEnd,
    handleSelect,
    handleKeyDown,
    getMentionedUsers,
    clearMentionedUsers,
    seedMentionedUsers,
  };
}
