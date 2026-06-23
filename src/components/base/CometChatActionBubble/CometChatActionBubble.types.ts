/** Props for CometChatActionBubble. */
export interface CometChatActionBubbleProps {
  /** The action text to display (e.g., "Alice joined the group"). */
  messageText: string;
  /**
   * Optional CSS class name for the icon displayed before the text.
   * Used for call status messages (outgoing, incoming, missed, etc.).
   * The icon is rendered via CSS mask — override in your own CSS to use custom icons.
   *
   * Built-in classes:
   * - cometchat-action-bubble__icon--missed-video
   * - cometchat-action-bubble__icon--missed-audio
   * - cometchat-action-bubble__icon--outgoing-video
   * - cometchat-action-bubble__icon--outgoing-audio
   * - cometchat-action-bubble__icon--incoming-video
   * - cometchat-action-bubble__icon--incoming-audio
   * - cometchat-action-bubble__icon--call-ended
   */
  iconClassName?: string;
  /** Whether to use error color for the icon (e.g., missed calls). */
  iconErrorColor?: boolean;
  /** Optional custom className. */
  className?: string;
}
