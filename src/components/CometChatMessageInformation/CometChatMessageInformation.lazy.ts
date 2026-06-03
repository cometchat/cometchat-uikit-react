/**
 * Default re-export for React.lazy() usage.
 *
 * Tier 5 — Secondary screen lazy (opened from message context menu).
 *
 * Usage:
 * ```ts
 * const CometChatMessageInformation = React.lazy(
 *   () => import('./CometChatMessageInformation.lazy')
 * );
 * ```
 */
export { CometChatMessageInformation as default } from './CometChatMessageInformation';
