import React, { useEffect, useRef } from 'react';
import { useCometChatGroupMembersContext } from './CometChatGroupMembers.context';
import { CometChatGroupMembersItem } from './CometChatGroupMembersItem';
import type { CometChatGroupMembersListProps } from './CometChatGroupMembers.types';
import './CometChatGroupMembers.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatGroupMembersList — Member list with infinite scroll.
 *
 * Uses IntersectionObserver on a sentinel element to trigger pagination.
 */
export const CometChatGroupMembersList: React.FC<CometChatGroupMembersListProps> = ({
  itemView,
}) => {
  const { getLocalizedString } = useLocale();
  const { members, hasMore, fetchState, fetchNext } = useCometChatGroupMembersContext();
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
      className={'cometchat-group-members__list'}
      role="listbox"
      aria-label={getLocalizedString('accessibility_group_members_list')}
      aria-busy={fetchState === 'loading'}
    >
      {members.map(member => (
        <React.Fragment key={member.getUid()}>
          {itemView ? itemView(member) : <CometChatGroupMembersItem member={member} />}
        </React.Fragment>
      ))}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className={'cometchat-group-members__sentinel'} aria-hidden="true" />
      )}
    </div>
  );
};

CometChatGroupMembersList.displayName = 'CometChatGroupMembers.List';
