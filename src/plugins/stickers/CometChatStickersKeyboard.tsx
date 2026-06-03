/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-floating-promises, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-misused-promises */
/**
 * CometChatStickersKeyboard
 *
 * Sticker picker with category tabs and a 4-column grid.
 * Fetches stickers from the CometChat stickers extension API.
 *
 * - Category tabs with horizontal wheel scroll + ArrowLeft/Right keyboard nav
 * - 4-column grid with arrow key navigation (wrapping at boundaries)
 * - Per-image shimmer placeholder until loaded
 * - Retry button on error state
 * - Escape to close
 * - ARIA: role="tablist"/"tab", role="grid"/"gridcell"
 * - loading="lazy" on all images
 * - prefers-reduced-motion respected
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useLocale } from '../../context/locale/LocaleContext';
import type {
  CometChatStickersKeyboardProps,
  CometChatStickerItem,
  CometChatStickerSet,
  CometChatStickersKeyboardState,
} from './CometChatStickersKeyboard.types';
import { STICKERS_CONSTANTS } from './stickers.constants';
import './CometChatStickersKeyboard.css';

const GRID_COLUMNS = 4;

/** Parse the SDK stickers response into a StickerSet. */
function parseStickersResponse(response: unknown): CometChatStickerSet {
  const sets: CometChatStickerSet = {};
  try {
    const raw = response as Record<string, unknown>;
    const data = (raw.data as Record<string, unknown>) ?? raw;
    const defaultStickers = data.defaultStickers as Record<string, unknown>[] | undefined;
    const customStickers = data.customStickers as Record<string, unknown>[] | undefined;

    const process = (stickers: Record<string, unknown>[], fallback: string) => {
      for (const s of stickers) {
        const setName = (s.stickerSetName as string) || fallback;
        const url = (s.stickerUrl as string) || '';
        if (!url) continue;
        if (!sets[setName]) sets[setName] = [];
        sets[setName].push({
          stickerUrl: url,
          stickerSetName: setName,
          stickerOrder: Number(s.stickerOrder) || 0,
        });
      }
    };

    if (Array.isArray(defaultStickers)) process(defaultStickers, 'Default');
    if (Array.isArray(customStickers)) process(customStickers, 'Custom');

    for (const name of Object.keys(sets)) {
      sets[name].sort((a, b) => (a.stickerOrder || 0) - (b.stickerOrder || 0));
    }
  } catch {
    /* ignore */
  }
  return sets;
}

export const CometChatStickersKeyboard: React.FC<CometChatStickersKeyboardProps> = ({
  onStickerClick,
  onClose,
  errorStateText,
  emptyStateText,
  autoFocus = true,
  stickerData,
  initialState,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const effectiveErrorStateText = errorStateText ?? getLocalizedString('sticker_failed_to_load');
  const effectiveEmptyStateText = emptyStateText ?? getLocalizedString('stickers_keyboard_empty');
  const [state, setState] = useState<CometChatStickersKeyboardState>(initialState ?? 'loading');
  const [stickerSets, setStickerSets] = useState<CometChatStickerSet>({});
  const [activeCategory, setActiveCategory] = useState('');
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const tabsRef = useRef<HTMLDivElement>(null);

  const categoryNames = Object.keys(stickerSets);
  const currentStickers = useMemo(
    () => stickerSets[activeCategory] ?? [],
    [stickerSets, activeCategory]
  );

  // Fetch stickers
  const fetchStickers = useCallback(async () => {
    setState('loading');
    try {
      const response = await CometChat.callExtension(
        STICKERS_CONSTANTS.extensionName,
        STICKERS_CONSTANTS.fetchMethod,
        STICKERS_CONSTANTS.fetchEndpoint,
        undefined
      );
      if (response && typeof response === 'object') {
        const parsed = parseStickersResponse(response);
        if (Object.keys(parsed).length === 0) {
          setState('empty');
          return;
        }
        setStickerSets(parsed);
        setActiveCategory(Object.keys(parsed)[0]);
        setState('loaded');
      } else {
        setState('empty');
      }
    } catch {
      setState('error');
    }
  }, []);

  // Init
  useEffect(() => {
    if (initialState) return;
    if (stickerData && Object.keys(stickerData).length > 0) {
      setStickerSets(stickerData);
      setActiveCategory(Object.keys(stickerData)[0]);
      setState('loaded');
    } else {
      fetchStickers();
    }
  }, [stickerData, initialState, fetchStickers]);

  // Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Auto-focus first tab
  useEffect(() => {
    if (state === 'loaded' && autoFocus) {
      const timer = setTimeout(() => {
        const firstTab = tabsRef.current?.querySelector('[role="tab"]')!;
        firstTab?.focus();
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [state, autoFocus]);

  const handleImageLoaded = useCallback((url: string) => {
    setLoadedImages(prev => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const handleStickerClick = useCallback(
    (sticker: CometChatStickerItem) => {
      onStickerClick({ stickerUrl: sticker.stickerUrl, stickerName: sticker.stickerSetName });
    },
    [onStickerClick]
  );

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = index < categoryNames.length - 1 ? index + 1 : 0;
        const tabs = tabsRef.current?.querySelectorAll('[role="tab"]');
        (tabs?.[next] as HTMLElement)?.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = index > 0 ? index - 1 : categoryNames.length - 1;
        const tabs = tabsRef.current?.querySelectorAll('[role="tab"]');
        (tabs?.[prev] as HTMLElement)?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveCategory(categoryNames[index]);
      }
    },
    [categoryNames]
  );

  const handleStickerKeyDown = useCallback(
    (e: React.KeyboardEvent, sticker: CometChatStickerItem, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStickerClick(sticker);
        return;
      }
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();

      const total = currentStickers.length;
      if (total === 0) return;
      const row = Math.floor(index / GRID_COLUMNS);
      const col = index % GRID_COLUMNS;
      const totalRows = Math.ceil(total / GRID_COLUMNS);
      let newIndex = index;

      switch (e.key) {
        case 'ArrowLeft':
          newIndex =
            col === 0 ? Math.min(row * GRID_COLUMNS + GRID_COLUMNS - 1, total - 1) : index - 1;
          break;
        case 'ArrowRight':
          newIndex =
            col === GRID_COLUMNS - 1 || index === total - 1 ? row * GRID_COLUMNS : index + 1;
          break;
        case 'ArrowUp':
          newIndex =
            row === 0
              ? Math.min((totalRows - 1) * GRID_COLUMNS + col, total - 1)
              : index - GRID_COLUMNS;
          break;
        case 'ArrowDown':
          newIndex = row === totalRows - 1 ? col : Math.min(index + GRID_COLUMNS, total - 1);
          break;
      }

      setTimeout(() => {
        const items = document.querySelectorAll('[role="gridcell"]');
        (items[newIndex] as HTMLElement)?.focus();
      }, 0);
    },
    [currentStickers, handleStickerClick]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const container = tabsRef.current;
    if (container) {
      const amount = Math.abs(e.deltaY) > 100 ? e.deltaY * 0.2 : e.deltaY * 0.5;
      container.scrollTo({ left: container.scrollLeft + amount, behavior: 'auto' });
    }
  }, []);

  const rootClasses = ['cometchat-stickers-keyboard', className].filter(Boolean).join(' ');

  // Loading state
  if (state === 'loading') {
    return (
      <div
        className={rootClasses}
        role="dialog"
        aria-label={getLocalizedString('accessibility_sticker_keyboard')}
        aria-modal="true"
      >
        <div className={'cometchat-stickers-keyboard__shimmer'} role="status" aria-live="polite">
          <div className={'cometchat-stickers-keyboard__shimmer-tabs'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={'cometchat-stickers-keyboard__shimmer-tab'} />
            ))}
          </div>
          <div className={'cometchat-stickers-keyboard__shimmer-grid'}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={'cometchat-stickers-keyboard__shimmer-sticker'} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div
        className={rootClasses}
        role="dialog"
        aria-label={getLocalizedString('accessibility_sticker_keyboard')}
        aria-modal="true"
      >
        <div className={'cometchat-stickers-keyboard__error'} role="alert" aria-live="assertive">
          <div className={'cometchat-stickers-keyboard__error-icon'}>
            <span className={'cometchat-stickers-keyboard__error-icon-mask'} aria-hidden="true" />
          </div>
          <span className={'cometchat-stickers-keyboard__error-text'}>
            {effectiveErrorStateText}
          </span>
          <button
            type="button"
            className={'cometchat-stickers-keyboard__retry-button'}
            onClick={() => fetchStickers()}
            aria-label={getLocalizedString('sticker_error')}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (state === 'empty') {
    return (
      <div
        className={rootClasses}
        role="dialog"
        aria-label={getLocalizedString('accessibility_sticker_keyboard')}
        aria-modal="true"
      >
        <div className={'cometchat-stickers-keyboard__empty'} role="status" aria-live="polite">
          <div className={'cometchat-stickers-keyboard__empty-icon'}>
            <span className={'cometchat-stickers-keyboard__empty-icon-mask'} aria-hidden="true" />
          </div>
          <span className={'cometchat-stickers-keyboard__empty-text'}>
            {effectiveEmptyStateText}
          </span>
        </div>
      </div>
    );
  }

  // Loaded state
  return (
    <div
      className={rootClasses}
      role="dialog"
      aria-label={getLocalizedString('accessibility_sticker_keyboard')}
      aria-modal="true"
    >
      {/* Category tabs */}
      <div
        className={'cometchat-stickers-keyboard__tabs'}
        ref={tabsRef}
        onWheel={handleWheel}
        role="tablist"
        aria-label={getLocalizedString('accessibility_sticker_categories')}
      >
        {categoryNames.map((name, i) => {
          const icon = stickerSets[name]?.[0]?.stickerUrl || '';
          return (
            <div
              key={name}
              className={[
                'cometchat-stickers-keyboard__tab',
                activeCategory === name ? 'cometchat-stickers-keyboard__tab--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="tab"
              aria-selected={activeCategory === name}
              aria-label={name}
              tabIndex={0}
              title={name}
              onClick={() => {
                setActiveCategory(name);
              }}
              onKeyDown={e => {
                handleTabKeyDown(e, i);
              }}
            >
              {icon && (
                <img
                  className={'cometchat-stickers-keyboard__tab-icon'}
                  src={icon}
                  alt={name}
                  loading="lazy"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Sticker grid */}
      <div
        className={'cometchat-stickers-keyboard__grid'}
        role="grid"
        aria-label={getLocalizedString('accessibility_stickers_category').replace(
          '{category}',
          activeCategory
        )}
      >
        {currentStickers.map((sticker, i) => (
          <div
            key={sticker.stickerUrl}
            className={'cometchat-stickers-keyboard__sticker-item'}
            role="gridcell"
            tabIndex={0}
            title={sticker.stickerSetName}
            aria-label={getLocalizedString('accessibility_sticker_from')
              .replace('{number}', String(i + 1))
              .replace('{name}', sticker.stickerSetName)}
            onClick={() => {
              handleStickerClick(sticker);
            }}
            onKeyDown={e => {
              handleStickerKeyDown(e, sticker, i);
            }}
          >
            {!loadedImages.has(sticker.stickerUrl) && (
              <div className={'cometchat-stickers-keyboard__sticker-shimmer'} />
            )}
            <img
              className={[
                'cometchat-stickers-keyboard__sticker-image',
                loadedImages.has(sticker.stickerUrl)
                  ? 'cometchat-stickers-keyboard__sticker-image--loaded'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              src={sticker.stickerUrl}
              alt={sticker.stickerSetName}
              loading="lazy"
              onLoad={() => {
                handleImageLoaded(sticker.stickerUrl);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

CometChatStickersKeyboard.displayName = 'CometChatStickersKeyboard';
