/**
 * Default re-export for React.lazy() usage.
 *
 * Tier 5 — Secondary screen lazy (only rendered when thread panel is open).
 *
 * Usage:
 * ```ts
 * const CometChatThreadHeader = React.lazy(
 *   () => import('./CometChatThreadHeader.lazy')
 * );
 * ```
 */
export { CometChatThreadHeader as default } from './CometChatThreadHeader';
