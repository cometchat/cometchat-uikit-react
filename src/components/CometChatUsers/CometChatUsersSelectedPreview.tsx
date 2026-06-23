import React, { useCallback } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { useCometChatUsersContext } from './CometChatUsers.context';
import { useLocale } from '../../context/locale/LocaleContext';
import type { CometChatUsersSelectedPreviewProps } from './CometChatUsers.types';
import './CometChatUsers.css';

/**
 * CometChatUsersSelectedPreview — Selected users chip preview (multiple mode).
 *
 * Uses CometChatAvatar for chip avatars and CometChatButton for close buttons.
 * Only renders when selectionMode is 'multiple' and there are selected users.
 */
export const CometChatUsersSelectedPreview: React.FC<CometChatUsersSelectedPreviewProps> = ({
  chipView,
}) => {
  const { selectedUserIds, selectedUsersMap, selectionMode, deselectUser, showScrollbar } =
    useCometChatUsersContext();
  const { getLocalizedString } = useLocale();

  const handleRemove = useCallback(
    (userId: string) => {
      deselectUser(userId);
    },
    [deselectUser]
  );

  if (selectionMode !== 'multiple' || selectedUserIds.length === 0) {
    return null;
  }

  // Get selected users in order
  const selectedUsers = selectedUserIds
    .map(uid => selectedUsersMap.get(uid))
    .filter((u): u is CometChat.User => u !== undefined);

  return (
    <div
      className={`cometchat-users__selected-preview ${!showScrollbar ? 'cometchat-users__selected-preview--hide-scrollbar' : ''}`}
      role="group"
      aria-label={getLocalizedString('accessibility_users_selected').replace(
        '{count}',
        String(selectedUsers.length)
      )}
    >
      <div className={'cometchat-users__selected-preview-container'}>
        {selectedUsers.map(user => {
          if (chipView) return chipView(user);

          const uid = user.getUid();
          const name = user.getName();
          const avatar = user.getAvatar();
          const displayName = name.trim().split(/\s+/)[0] ?? 'User';

          return (
            <div key={uid} className={'cometchat-users__selected-preview-chip'}>
              <div className={'cometchat-users__selected-preview-chip-avatar'}>
                <CometChatAvatar name={name} image={avatar} size="small" />
              </div>
              <span className={'cometchat-users__selected-preview-chip-name'}>{displayName}</span>
              <button
                className={'cometchat-users__selected-preview-chip-close'}
                onClick={() => {
                  handleRemove(uid);
                }}
                aria-label={getLocalizedString('accessibility_remove_item').replace('{name}', name)}
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M9.354 3.354a.5.5 0 0 0-.708-.708L6 5.293 3.354 2.646a.5.5 0 1 0-.708.708L5.293 6 2.646 8.646a.5.5 0 0 0 .708.708L6 6.707l2.646 2.647a.5.5 0 0 0 .708-.708L6.707 6l2.647-2.646z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

CometChatUsersSelectedPreview.displayName = 'CometChatUsers.SelectedPreview';
