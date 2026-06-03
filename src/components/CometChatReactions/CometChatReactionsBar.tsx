import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CometChatReactionsBarProps } from './CometChatReactions.types';
import { useCometChatReactionsContext } from './CometChatReactions.context';
import { CometChatReactionsChip } from './CometChatReactionsChip';
import { CometChatReactionsOverflow } from './CometChatReactionsOverflow';
import { CometChatReactionsInfo } from './CometChatReactionsInfo';
import { CometChatReactionsList } from './CometChatReactionsList';
import { CometChatPopover } from '../base/CometChatPopover';
import './CometChatReactions.css';
import { useLocale } from '../../context/locale/LocaleContext';

const CHIP_WIDTH = 48; // 46px chip + 2px gap
const REACTIONS_PADDING = 8;
/**
 * CometChatReactionsBar — the reaction chips bar (role="group").
 *
 * Renders visible reaction chips with hover tooltips (Info) and
 * an overflow button that opens the full ReactionList popover.
 * Uses ResizeObserver on its own container for overflow calculation.
 */
export const CometChatReactionsBar: React.FC<CometChatReactionsBarProps> = ({
  maxVisible: maxVisibleProp,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const { reactions, alignment } = useCometChatReactionsContext();
  const barRef = useRef<HTMLDivElement>(null);
  const [computedMaxVisible, setComputedMaxVisible] = useState(
    maxVisibleProp ?? reactions.length // Show all initially; ResizeObserver constrains after layout
  );

  const maxVisible = maxVisibleProp ?? computedMaxVisible;

  // ResizeObserver: observe the content view sibling (the bubble content above reactions)
  // to get the natural bubble width. With width:0;min-width:100% on the reactions,
  // the content view's width is not influenced by reactions.
  useEffect(() => {
    if (maxVisibleProp != null || !barRef.current) return;

    // Traverse up: barRef → reactions root → footer-view → body
    const footerView = barRef.current.closest('[class*="body-footer-view"]');
    const body = footerView?.parentElement;
    const contentView = body?.querySelector('[class*="body-content-view"]');

    if (!contentView) {
      // Fallback: no content view found (test env or standalone) — show all
      setComputedMaxVisible(100);
      return;
    }

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width - REACTIONS_PADDING;
        const calculated = Math.max(1, Math.floor(width / CHIP_WIDTH));
        setComputedMaxVisible(calculated);
      }
    });
    observer.observe(contentView);
    return () => {
      observer.disconnect();
    };
  }, [maxVisibleProp]);

  // Calculate visible reactions and overflow
  const totalReactions = reactions.length;
  const showOverflow = totalReactions > maxVisible && maxVisible > 2;
  const visibleCount = showOverflow ? maxVisible - 1 : Math.min(totalReactions, maxVisible);
  const visibleReactions = reactions.slice(0, visibleCount);
  const overflowCount = totalReactions - visibleCount;

  // Keyboard navigation between chips
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!barRef.current) return;
    const buttons = barRef.current.querySelectorAll('button');
    if (!buttons.length) return;

    const currentIndex = Array.from(buttons).indexOf(target as HTMLButtonElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % buttons.length;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      e.preventDefault();
    } else {
      return;
    }
    const nextButton = buttons[nextIndex];
    if (nextButton) {
      nextButton.focus();
    }
  }, []);

  const barClass = ['cometchat-reactions__bar', className ?? ''].filter(Boolean).join(' ');

  const listPlacement: 'left' | 'right' = alignment === 'left' ? 'right' : 'left';

  if (reactions.length === 0) return null;

  return (
    <div
      ref={barRef}
      className={barClass}
      role="group"
      aria-label={getLocalizedString('accessibility_reactions')}
      aria-live="polite"
      onKeyDown={handleKeyDown}
    >
      {visibleReactions.map(reaction => (
        <div key={reaction.getReaction()} className={'cometchat-reactions__info-wrapper'}>
          <CometChatPopover.Root showOnHover debounceOnHover={500} placement="top">
            <CometChatPopover.Trigger>
              <CometChatReactionsChip reaction={reaction} />
            </CometChatPopover.Trigger>
            <CometChatPopover.Content>
              <CometChatReactionsInfo emoji={reaction.getReaction()} />
            </CometChatPopover.Content>
          </CometChatPopover.Root>
        </div>
      ))}

      {overflowCount > 0 && (
        <CometChatPopover.Root placement={listPlacement} closeOnOutsideClick>
          <CometChatPopover.Trigger>
            <CometChatReactionsOverflow count={overflowCount} />
          </CometChatPopover.Trigger>
          <CometChatPopover.Content>
            <CometChatReactionsList />
          </CometChatPopover.Content>
        </CometChatPopover.Root>
      )}
    </div>
  );
};
