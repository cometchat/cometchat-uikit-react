import React, { useCallback, useEffect, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatUsersContext } from './CometChatUsers.context';
import { CometChatUsersItem } from './CometChatUsersItem';
import { CometChatUsersSectionHeader } from './CometChatUsersSectionHeader';
import type { CometChatUsersListProps } from './CometChatUsers.types';
import './CometChatUsers.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatUsersList — User list with infinite scroll.
 *
 * Uses IntersectionObserver on a sentinel element to trigger pagination.
 * Renders alphabetical section headers when sectionHeaderKey is configured.
 */
export const CometChatUsersList: React.FC<CometChatUsersListProps> = ({ itemView }) => {
  const { getLocalizedString } = useLocale();
  const {
    users,
    hasMore,
    fetchState,
    fetchNext,
    sectionHeaderKey,
    showSectionHeader,
    showScrollbar,
  } = useCometChatUsersContext();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // --- Infinite scroll via IntersectionObserver ---
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && fetchState !== 'loading') {
          void fetchNext();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, fetchState, fetchNext]);

  // --- Section header logic ---
  const getSectionHeaderChar = useCallback(
    (user: CometChat.User): string => {
      try {
        const key = sectionHeaderKey;
        const value = user[key];
        const str =
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
          typeof value === 'function' ? String((value as () => string).call(user)) : String(value);
        return str.charAt(0).toUpperCase();
      } catch {
        return '';
      }
    },
    [sectionHeaderKey]
  );

  const shouldShowSectionHeader = useCallback(
    (index: number): boolean => {
      if (index === 0) return true;
      const currentUser = users[index];
      const prevUser = users[index - 1];
      if (!currentUser || !prevUser) return false;
      const currentChar = getSectionHeaderChar(currentUser);
      const prevChar = getSectionHeaderChar(prevUser);
      return currentChar !== prevChar;
    },
    [users, getSectionHeaderChar]
  );

  // Don't render the list container if there are no users to show
  if (fetchState !== 'loaded' && users.length === 0) return null;

  return (
    <div
      className={`cometchat-users__list ${!showScrollbar ? 'cometchat-users__list--hide-scrollbar' : ''}`}
      role="listbox"
      aria-label={getLocalizedString('accessibility_users_list')}
      aria-busy={fetchState === 'loading'}
    >
      {users.map((user, index) => {
        const showHeader = showSectionHeader && shouldShowSectionHeader(index);
        const headerChar = showHeader ? getSectionHeaderChar(user) : '';

        return (
          <React.Fragment key={user.getUid()}>
            {showHeader && headerChar && <CometChatUsersSectionHeader letter={headerChar} />}
            {itemView ? itemView(user) : <CometChatUsersItem user={user} />}
          </React.Fragment>
        );
      })}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className={'cometchat-users__sentinel'} aria-hidden="true" />
      )}
    </div>
  );
};

CometChatUsersList.displayName = 'CometChatUsers.List';
