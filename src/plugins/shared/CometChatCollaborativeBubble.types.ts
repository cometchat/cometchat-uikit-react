/**
 * Types for the shared CometChatCollaborativeBubble component.
 *
 * Used by both CometChatCollaborativeDocumentPlugin and
 * CometChatCollaborativeWhiteboardPlugin.
 */

/** Props for the shared collaborative bubble component. */
export interface CometChatCollaborativeBubbleProps {
  /** The extracted URL for the collaborative session. */
  url: string;
  /** Bubble variant based on sender/receiver. */
  variant: 'incoming' | 'outgoing';
  /** Localized title text (e.g., "Collaborative Document"). */
  title: string;
  /** Localized subtitle text (e.g., "Open document to edit content together"). */
  subtitle: string;
  /** Localized button text (e.g., "Open Document"). */
  buttonText: string;
  /** Theme-aware banner image URL. */
  bannerImageUrl?: string;
  /** Icon type — determines which mask-image icon is shown. */
  iconType?: 'document' | 'whiteboard';
  /**
   * Callback when the action button is clicked.
   * Receives the URL. If not provided, defaults to `window.open`.
   */
  onButtonClick?: (url: string) => void;
  /**
   * Whether to disable the action button.
   * Used in thread header context to prevent interaction.
   * @default false
   */
  disabled?: boolean;
  /** Optional custom className. */
  className?: string;
}
