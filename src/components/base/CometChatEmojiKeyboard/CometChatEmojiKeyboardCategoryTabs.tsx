import React, { useCallback, useRef } from 'react';
import type { CometChatEmojiKeyboardCategoryTabsProps } from './CometChatEmojiKeyboard.types';
import { useCometChatEmojiKeyboardContext } from './CometChatEmojiKeyboard.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatEmojiKeyboard.css';

/**
 * Horizontal scrollable category tab bar.
 * Follows WAI-ARIA Tabs pattern with roving tabindex.
 */
export const CometChatEmojiKeyboardCategoryTabs: React.FC<
  CometChatEmojiKeyboardCategoryTabsProps
> = ({ className }) => {
  const { categories, activeCategoryId, setActiveCategory } = useCometChatEmojiKeyboardContext();
  const { getLocalizedString } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollAmount = e.deltaY * 0.5;
    if (e.deltaMode === 1 || e.deltaY > 100) {
      scrollAmount = e.deltaY * 0.2;
    }

    container.scrollTo({
      top: 0,
      left: container.scrollLeft + scrollAmount,
      behavior: 'auto',
    });
  }, []);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const tabs = scrollRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
      if (!tabs) return;

      let newIndex = -1;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = index < categories.length - 1 ? index + 1 : 0;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = index > 0 ? index - 1 : categories.length - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = categories.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const cat = categories[index];
        if (cat) setActiveCategory(cat.id);
        return;
      }

      if (newIndex >= 0 && newIndex < tabs.length) {
        tabs[newIndex]?.focus();
      }
    },
    [categories, setActiveCategory]
  );

  const activeIndex = categories.findIndex(c => c.id === activeCategoryId);

  const tabsClass = ['cometchat-emoji-keyboard__tabs', className].filter(Boolean).join(' ');

  return (
    <div
      className={tabsClass}
      ref={scrollRef}
      onWheel={handleWheel}
      role="tablist"
      aria-label={getLocalizedString('accessibility_emoji_categories')}
    >
      {categories.map((category, index) => {
        const isActive = category.id === activeCategoryId;
        const tabClass = [
          'cometchat-emoji-keyboard__tab',
          isActive ? 'cometchat-emoji-keyboard__tab--active' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const label = getLocalizedString(category.name);

        return (
          <button
            key={category.id}
            className={tabClass}
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            aria-controls={`emoji-panel-${category.id}`}
            tabIndex={index === activeIndex ? 0 : -1}
            title={label}
            onClick={() => {
              setActiveCategory(category.id);
            }}
            onKeyDown={e => {
              handleTabKeyDown(e, index);
            }}
            type="button"
          >
            {category.symbolURL ? (
              <img
                className={'cometchat-emoji-keyboard__tab-icon'}
                src={category.symbolURL}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : (
              <span className={'cometchat-emoji-keyboard__tab-emoji'}>
                {getFirstEmoji(category.emojis)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

function getFirstEmoji(emojis: Record<string, { char: string }>): string {
  const first = Object.values(emojis)[0];
  return first ? first.char : '⬜';
}
