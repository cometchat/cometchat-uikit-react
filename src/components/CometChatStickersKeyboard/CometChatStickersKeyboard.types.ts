/**
 * Types for the CometChatStickersKeyboard component.
 */

/** Event emitted when a sticker is clicked. */
export interface CometChatStickerClickEvent {
  /** URL of the selected sticker. */
  stickerUrl: string;
  /** Name of the selected sticker set. */
  stickerName: string;
}

/** A single sticker item. */
export interface CometChatStickerItem {
  /** URL of the sticker image. */
  stickerUrl: string;
  /** Name of the sticker set this sticker belongs to. */
  stickerSetName: string;
  /** Order of the sticker within its set. */
  stickerOrder?: number;
}

/** A collection of sticker sets keyed by set name. */
export type CometChatStickerSet = Record<string, CometChatStickerItem[]>;

/** Component state. */
export type CometChatStickersKeyboardState = 'loading' | 'loaded' | 'error' | 'empty';

/** Props for the CometChatStickersKeyboard component. */
export interface CometChatStickersKeyboardProps {
  /** Callback when a sticker is selected. */
  onStickerClick: (event: CometChatStickerClickEvent) => void;
  /** Callback when keyboard requests close (Escape key). */
  onClose?: () => void;
  /** Custom error state text. */
  errorStateText?: string;
  /** Custom empty state text. */
  emptyStateText?: string;
  /** Whether to auto-focus first tab on mount. @default true */
  autoFocus?: boolean;
  /** Pre-loaded sticker data (for Storybook/testing). Skips SDK fetch. */
  stickerData?: CometChatStickerSet;
  /** Force initial state (for Storybook/testing). */
  initialState?: 'loading' | 'error' | 'empty';
  /** Optional className. */
  className?: string;
}
