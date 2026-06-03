import React, { useCallback, useMemo, useRef } from 'react';
import type { CometChatReactionListTabsProps } from './CometChatReactionList.types';
import { useCometChatReactionListContext } from './CometChatReactionList.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatReactionList.css';

/**
 * CometChatReactionList.Tabs — emoji tab bar.
 *
 * Renders an "All" tab plus one tab per unique emoji.
 * Supports keyboard navigation (ArrowLeft/ArrowRight).
 * Scrollable horizontally when tabs overflow.
 */
export const CometChatReactionListTabs: React.FC<CometChatReactionListTabsProps> = ({
  className,
}) => {
  const { selectedEmoji, emojiTabs, totalCount, groupedReactions, selectEmoji } =
    useCometChatReactionListContext();
  const { getLocalizedString } = useLocale();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const allText = getLocalizedString('reaction_list_all') || 'All';

  // Build tab data: "All" + one per emoji
  const tabs = useMemo(
    () => [
      { id: null as string | null, label: allText, count: totalCount },
      ...emojiTabs.map(emoji => ({
        id: emoji,
        label: emoji,
        count: groupedReactions.get(emoji)?.length ?? 0,
      })),
    ],
    [allText, totalCount, emojiTabs, groupedReactions]
  );

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, tabIndex: number) => {
      let nextIndex = tabIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (tabIndex + 1) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (tabIndex - 1 + tabs.length) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'Home') {
        nextIndex = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
        e.preventDefault();
      } else {
        return;
      }

      const nextTab = tabs[nextIndex];
      if (nextTab) {
        selectEmoji(nextTab.id);
        // Focus the new tab button
        if (tabsContainerRef.current) {
          const tabElements =
            tabsContainerRef.current.querySelectorAll<HTMLElement>('[role="tab"]');
          tabElements[nextIndex]?.focus();
        }
      }
    },
    [tabs, selectEmoji]
  );

  const rootClass = ['cometchat-reaction-list__tabs', className ?? ''].filter(Boolean).join(' ');

  return (
    <div
      ref={tabsContainerRef}
      className={rootClass}
      role="tablist"
      aria-label={getLocalizedString('accessibility_reaction_filters')}
    >
      {tabs.map((tab, index) => {
        const isActive = selectedEmoji === tab.id;
        const tabClass = [
          'cometchat-reaction-list__tabs-tab',
          isActive ? 'cometchat-reaction-list__tabs-tab--active' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={tab.id ?? 'all'}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={tabClass}
            onClick={() => {
              selectEmoji(tab.id);
            }}
            onKeyDown={e => {
              handleTabKeyDown(e, index);
            }}
          >
            <span
              className={[
                'cometchat-reaction-list__tabs-tab-emoji',
                isActive ? 'cometchat-reaction-list__tabs-tab-emoji--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {tab.label}
            </span>
            <span
              className={[
                'cometchat-reaction-list__tabs-tab-count',
                isActive ? 'cometchat-reaction-list__tabs-tab-count--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
