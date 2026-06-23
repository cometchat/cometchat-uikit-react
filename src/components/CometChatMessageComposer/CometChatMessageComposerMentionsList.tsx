/**
 * CometChatMessageComposerMentionsList — dropdown for mention suggestions.
 *
 * Uses CometChatUsers / CometChatGroupMembers internally for built-in
 * scroll-based pagination with keyboard navigation and accessibility.
 *
 * Renders inside the text-input-wrapper, positioned absolutely above the input.
 */

import React, { useCallback, useMemo, useRef } from 'react';
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
}

export const CometChatMessageComposerMentionsList: React.FC<
  CometChatMessageComposerMentionsListProps
> = ({
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
}) => {
  const { getLocalizedString } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

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
      id="mention-suggestions-listbox"
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
