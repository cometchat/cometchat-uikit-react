import React, { useCallback, useRef, useState } from 'react';
import type { CometChatEmojiKeyboardEmojiGridProps } from './CometChatEmojiKeyboard.types';
import { useCometChatEmojiKeyboardContext } from './CometChatEmojiKeyboard.context';
import './CometChatEmojiKeyboard.css';

const GRID_COLUMNS = 8;

/**
 * Emoji grid with arrow key navigation.
 * Uses `role="grid"` with `role="gridcell"` for screen reader navigation.
 */
export const CometChatEmojiKeyboardEmojiGrid: React.FC<CometChatEmojiKeyboardEmojiGridProps> = ({
  emojis,
  className,
}) => {
  const { onEmojiClick } = useCometChatEmojiKeyboardContext();
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const entries = Object.entries(emojis);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const items = gridRef.current?.querySelectorAll<HTMLElement>('[role="gridcell"]');
      if (!items) return;

      let newIndex = -1;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          e.stopPropagation();
          newIndex = index < entries.length - 1 ? index + 1 : 0;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          e.stopPropagation();
          newIndex = index > 0 ? index - 1 : entries.length - 1;
          break;
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          newIndex = index + GRID_COLUMNS;
          if (newIndex >= entries.length) newIndex = index % GRID_COLUMNS;
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          newIndex = index - GRID_COLUMNS;
          if (newIndex < 0) {
            const lastRowStart = Math.floor((entries.length - 1) / GRID_COLUMNS) * GRID_COLUMNS;
            newIndex = lastRowStart + (index % GRID_COLUMNS);
            if (newIndex >= entries.length) newIndex = entries.length - 1;
          }
          break;
        case 'Home':
          e.preventDefault();
          e.stopPropagation();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          e.stopPropagation();
          newIndex = entries.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          e.stopPropagation();
          {
            const entry = entries[index];
            if (entry) onEmojiClick(entry[1].char);
          }
          return;
        default:
          return;
      }

      if (newIndex >= 0 && newIndex < entries.length) {
        setFocusedIndex(newIndex);
        items[newIndex]?.focus();
      }
    },
    [entries, onEmojiClick]
  );

  const gridClass = ['cometchat-emoji-keyboard__emoji-grid', className].filter(Boolean).join(' ');

  return (
    <div className={gridClass} ref={gridRef} role="grid" aria-colcount={GRID_COLUMNS}>
      {entries.map(([name, emoji], index) => (
        <button
          key={name}
          className={'cometchat-emoji-keyboard__emoji-item'}
          role="gridcell"
          aria-label={name}
          aria-colindex={(index % GRID_COLUMNS) + 1}
          tabIndex={index === focusedIndex ? 0 : -1}
          title={name}
          onClick={() => {
            onEmojiClick(emoji.char);
          }}
          onKeyDown={e => {
            handleKeyDown(e, index);
          }}
          onFocus={() => {
            setFocusedIndex(index);
          }}
          type="button"
        >
          {emoji.char}
        </button>
      ))}
    </div>
  );
};
