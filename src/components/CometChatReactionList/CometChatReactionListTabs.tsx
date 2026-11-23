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
  const {
    selectedEmoji,
    emojiTabs,
    totalCount,
    groupedReactions,
    selectEmoji,
    connectToLoad,
    message,
  } = useCometChatReactionListContext();
  const { getLocalizedString } = useLocale();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const allText = getLocalizedString('reaction_list_all') || 'All';

  // Tab data: "All" (id null) + one per emoji. Offline before any reactor has loaded, the
  // counts come from the message itself (as on Android) until the list can load.
  const tabs = useMemo(() => {
    const own = connectToLoad && !totalCount ? message.getReactions() : null;
    const emojis = own
      ? own.map(r => ({ id: r.getReaction(), count: r.getCount() }))
      : emojiTabs.map(id => ({
          id,
          count: groupedReactions.get(id)?.length ?? 0,
        }));
    return [
      {
        id: null as string | null,
        count: own ? emojis.reduce((n, e) => n + e.count, 0) : totalCount,
      },
      ...emojis,
    ];
  }, [totalCount, emojiTabs, groupedReactions, connectToLoad, message]);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, tabIndex: number) => {
      const n = tabs.length;
      const k = e.key;
      const next =
        k === 'ArrowRight'
          ? (tabIndex + 1) % n
          : k === 'ArrowLeft'
            ? (tabIndex - 1 + n) % n
            : k === 'Home'
              ? 0
              : k === 'End'
                ? n - 1
                : -1;
      const nextTab = tabs[next];
      if (!nextTab) return;
      e.preventDefault();
      selectEmoji(nextTab.id);
      // Focus the new tab button
      tabsContainerRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
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
        const active = (base: string) => `${base}${isActive ? ` ${base}--active` : ''}`;

        return (
          <button
            key={tab.id ?? 'all'}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={active('cometchat-reaction-list__tabs-tab')}
            onClick={() => {
              selectEmoji(tab.id);
            }}
            onKeyDown={e => {
              handleTabKeyDown(e, index);
            }}
          >
            <span className={active('cometchat-reaction-list__tabs-tab-emoji')}>
              {tab.id ?? allText}
            </span>
            <span className={active('cometchat-reaction-list__tabs-tab-count')}>{tab.count}</span>
          </button>
        );
      })}
    </div>
  );
};
