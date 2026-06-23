import React, { useEffect, useRef } from 'react';
import { useCometChatGroupsContext } from './CometChatGroups.context';
import { CometChatGroupsItem } from './CometChatGroupsItem';
import type { CometChatGroupsListProps } from './CometChatGroups.types';
import './CometChatGroups.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupsList — Group list with infinite scroll.
 *
 * Uses IntersectionObserver on a sentinel element to trigger pagination.
 * No section headers — groups are rendered as a flat list.
 */
export const CometChatGroupsList: React.FC<CometChatGroupsListProps> = ({ itemView }) => {
  const { getLocalizedString } = useLocale();
  const { groups, hasMore, fetchState, fetchNext, showScrollbar } = useCometChatGroupsContext();
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

  return (
    <div
      className={[
        'cometchat-groups__list',
        !showScrollbar ? 'cometchat-groups__list--hide-scrollbar' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="listbox"
      aria-label={getLocalizedString('accessibility_groups_list')}
      aria-busy={fetchState === 'loading'}
    >
      {groups.map(group => (
        <React.Fragment key={group.getGuid()}>
          {itemView ? itemView(group) : <CometChatGroupsItem group={group} />}
        </React.Fragment>
      ))}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className={'cometchat-groups__sentinel'} aria-hidden="true" />
      )}
    </div>
  );
};

CometChatGroupsList.displayName = 'CometChatGroups.List';
