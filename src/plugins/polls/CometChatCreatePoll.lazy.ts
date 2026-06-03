/**
 * Default re-export for React.lazy() usage.
 *
 * Tier 4 — Dialog lazy (loaded when user clicks the polls attachment action).
 *
 * Usage:
 * ```ts
 * const CometChatCreatePoll = React.lazy(
 *   () => import('./CometChatCreatePoll.lazy')
 * );
 * ```
 */
export { CometChatCreatePoll as default } from './CometChatCreatePoll';
