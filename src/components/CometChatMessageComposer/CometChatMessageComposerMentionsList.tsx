/**
 * CometChatMessageComposerMentionsList — dropdown for mention suggestions.
 *
 * Uses CometChatUsers / CometChatGroupMembers internally for built-in
 * scroll-based pagination with keyboard navigation and accessibility.
 *
 * Renders inside the text-input-wrapper, positioned absolutely above the input.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUsers } from '../CometChatUsers/CometChatUsers';
import { CometChatGroupMembers } from '../CometChatGroupMembers/CometChatGroupMembers';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageComposer.css';

export interface CometChatMessageComposerMentionsListProps {
  /** Whether the dropdown is open. */
  isOpen: boolean;
  /** Current search keyword (text after @). */
  searchKeyword: string;
  /** Group for group-member mentions. Mutually exclusive with user. */
  group?: CometChat.Group;
  /** User for 1:1 chat mentions (searches all users). Mutually exclusive with group. */
  user?: CometChat.User;
  /** Custom users request builder. */
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  /** Custom group members request builder. */
  groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  /** Whether individual member mentions are disabled (only @all remains). */
  disableMentions?: boolean;
  /** Whether @all mention is disabled. */
  disableMentionAll?: boolean;
  /** Label for the @all mention. */
  mentionAllLabel?: string;
  /** Called when a user/member is selected. */
  onItemClick: (item: CometChat.User | CometChat.GroupMember | null) => void;
  /** Called when the list becomes empty (no results). */
  onEmpty?: () => void;
  /** Called on error. */
  onError?: () => void;
  /** Id for the listbox element, so the composer can point aria-controls at it. */
  listboxId?: string;
  /**
   * Reports the id of the highlighted option (null when nothing is highlighted),
   * so the composer can mirror it in aria-activedescendant. Options are given an
   * id on demand — the child list components don't assign one.
   */
  onHighlightChange?: (optionId: string | null) => void;
}

/**
 * Imperative handle so the composer can drive keyboard navigation over the
 * suggestions while the editor keeps focus (combobox-style interaction).
 */
export interface CometChatMessageComposerMentionsListHandle {
  /** Move the highlight by `delta` (+1 = next, -1 = previous), wrapping around. */
  moveHighlight: (delta: number) => boolean;
  /** Select the currently highlighted suggestion. Returns true if one was selected. */
  selectHighlighted: () => boolean;
}

/**
 * Data attribute marking the highlighted option. Applied imperatively (not via
 * React props) because the option elements are owned by the child list
 * components; React would otherwise overwrite a managed className/aria attr on
 * re-render, but it leaves unknown attributes set on the DOM untouched.
 */
const HIGHLIGHT_ATTR = 'data-cc-mention-active';

const CometChatMessageComposerMentionsListInner = (
  {
    isOpen,
    searchKeyword,
    group,
    user,
    usersRequestBuilder,
    groupMembersRequestBuilder,
    disableMentions = false,
    disableMentionAll = false,
    mentionAllLabel = 'all',
    onItemClick,
    onEmpty,
    onError,
    listboxId,
    onHighlightChange,
  }: CometChatMessageComposerMentionsListProps,
  ref: React.ForwardedRef<CometChatMessageComposerMentionsListHandle>
) => {
  const { getLocalizedString } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightedElRef = useRef<HTMLElement | null>(null);
  // Fall back to a generated id when the composer doesn't supply one, so two
  // composers on the same page (main + thread) never share a listbox id.
  const fallbackListboxId = useId();
  const resolvedListboxId = listboxId ?? `cometchat-mention-listbox-${fallbackListboxId}`;
  // onHighlightChange is called from imperative handlers; keep it in a ref so
  // they aren't rebuilt when the callback identity changes.
  const onHighlightChangeRef = useRef(onHighlightChange);
  onHighlightChangeRef.current = onHighlightChange;

  // --- Keyboard navigation over the rendered suggestion options -------------

  const getOptions = useCallback((): HTMLElement[] => {
    const root = containerRef.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>('[role="option"]'));
  }, []);

  const applyHighlight = useCallback(
    (el: HTMLElement | null, index = 0) => {
      const prev = highlightedElRef.current;
      if (prev && prev !== el) {
        prev.removeAttribute(HIGHLIGHT_ATTR);
      }
      highlightedElRef.current = el;
      if (el) {
        el.setAttribute(HIGHLIGHT_ATTR, 'true');
        // Screen readers follow aria-activedescendant by id, and options come
        // from the child list components without one.
        if (!el.id) el.id = `${resolvedListboxId}-opt-${String(index)}`;
        el.scrollIntoView({ block: 'nearest' });
      }
      onHighlightChangeRef.current?.(el?.id ?? null);
    },
    [resolvedListboxId]
  );

  const moveHighlight = useCallback(
    (delta: number): boolean => {
      const options = getOptions();
      if (options.length === 0) return false;
      const current = highlightedElRef.current;
      const currentIndex = current ? options.indexOf(current) : -1;
      const nextIndex =
        currentIndex === -1
          ? delta > 0
            ? 0
            : options.length - 1
          : (currentIndex + delta + options.length) % options.length;
      applyHighlight(options[nextIndex] ?? null, nextIndex);
      return true;
    },
    [getOptions, applyHighlight]
  );

  const selectHighlighted = useCallback((): boolean => {
    const options = getOptions();
    if (options.length === 0) return false;
    const current = highlightedElRef.current;
    const target = current && options.includes(current) ? current : options[0];
    if (!target) return false;
    target.click();
    return true;
  }, [getOptions]);

  useImperativeHandle(ref, () => ({ moveHighlight, selectHighlighted }), [
    moveHighlight,
    selectHighlighted,
  ]);

  // Keep the first option highlighted as results stream in, and reset the
  // highlight whenever the dropdown opens or the search keyword changes.
  useEffect(() => {
    const root = containerRef.current;
    if (!isOpen || !root) {
      highlightedElRef.current = null;
      onHighlightChangeRef.current?.(null);
      return;
    }

    const ensureHighlight = () => {
      const options = getOptions();
      const current = highlightedElRef.current;
      if (current && root.contains(current)) return; // keep the user's choice
      applyHighlight(options[0] ?? null, 0);
    };

    applyHighlight(null); // clear stale highlight from a previous query
    ensureHighlight();

    const observer = new MutationObserver(ensureHighlight);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [isOpen, searchKeyword, getOptions, applyHighlight]);

  // Determine if @all should be shown
  const shouldShowMentionAll = useMemo(() => {
    if (disableMentionAll || !group) return false;
    if (
      searchKeyword &&
      searchKeyword.trim().length > 0 &&
      !mentionAllLabel.toLowerCase().startsWith(searchKeyword.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  }, [searchKeyword, mentionAllLabel, disableMentionAll, group]);

  // Handle @all selection
  const handleMentionAllSelect = useCallback(() => {
    onItemClick(null);
  }, [onItemClick]);

  // Handle @all click
  const handleMentionAllClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleMentionAllSelect();
    },
    [handleMentionAllSelect]
  );

  // Handle @all keyboard
  const handleMentionAllKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleMentionAllSelect();
      }
    },
    [handleMentionAllSelect]
  );

  // Prevent input blur when interacting with the dropdown
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Handle empty callback — fire when nothing is visible in the dropdown
  const handleOnEmpty = useCallback(() => {
    if (!shouldShowMentionAll) {
      onEmpty?.();
    }
  }, [onEmpty, shouldShowMentionAll]);

  const shouldCloseWhenMentionsDisabled = disableMentions && !shouldShowMentionAll;

  React.useEffect(() => {
    if (isOpen && shouldCloseWhenMentionsDisabled) {
      onEmpty?.();
    }
  }, [isOpen, shouldCloseWhenMentionsDisabled, onEmpty]);

  if (!isOpen || shouldCloseWhenMentionsDisabled) return null;

  return (
    <div
      ref={containerRef}
      className="cometchat-message-composer__mentions-list"
      role="listbox"
      tabIndex={-1}
      id={resolvedListboxId}
      aria-label={getLocalizedString('accessibility_mention_suggestions') || 'Mention suggestions'}
      onMouseDown={handleMouseDown}
    >
      {/* @all mention option */}
      {shouldShowMentionAll && group && (
        <div
          className="cometchat-message-composer__mentions-item cometchat-message-composer__mentions-item--all "
          role="option"
          aria-selected={false}
          tabIndex={-1}
          onClick={handleMentionAllClick}
          onKeyDown={handleMentionAllKeyDown}
        >
          <CometChatAvatar.Root name={group.getName()} image={group.getIcon()} size="medium">
            <CometChatAvatar.Image />
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
          <span className="cometchat-message-composer__mentions-item-name">
            @{getLocalizedString(`message_composer_mention_${mentionAllLabel}`) || mentionAllLabel}{' '}
            <span className="cometchat-message-composer__mentions-item-badge">
              {getLocalizedString('message_composer_mention_notify_everyone_label')}
            </span>
          </span>
        </div>
      )}

      {/* Users list (1:1 chat) — only when individual mentions are enabled */}
      {user && !disableMentions && (
        <CometChatUsers
          hideSearch={true}
          showSectionHeader={false}
          searchKeyword={searchKeyword}
          onItemClick={(u: CometChat.User) => {
            onItemClick(u);
          }}
          onEmpty={handleOnEmpty}
          onError={
            onError
              ? () => {
                  onError();
                }
              : undefined
          }
          {...(usersRequestBuilder ? { usersRequestBuilder } : {})}
          headerView={null}
          trailingView={() => null}
          emptyView={<></>}
          errorView={<></>}
        />
      )}

      {/* Group members list (group chat) — only when individual mentions are enabled */}
      {group && !disableMentions && (
        <CometChatGroupMembers
          group={group}
          hideSearch={true}
          searchKeyword={searchKeyword}
          onItemClick={(member: CometChat.GroupMember) => {
            onItemClick(member);
          }}
          onEmpty={handleOnEmpty}
          onError={
            onError
              ? () => {
                  onError();
                }
              : undefined
          }
          {...(groupMembersRequestBuilder
            ? { groupMemberRequestBuilder: groupMembersRequestBuilder }
            : {})}
          headerView={null}
          trailingView={() => null}
          emptyView={<></>}
          errorView={<></>}
        />
      )}
    </div>
  );
};

export const CometChatMessageComposerMentionsList = forwardRef<
  CometChatMessageComposerMentionsListHandle,
  CometChatMessageComposerMentionsListProps
>(CometChatMessageComposerMentionsListInner);

CometChatMessageComposerMentionsList.displayName = 'CometChatMessageComposerMentionsList';
