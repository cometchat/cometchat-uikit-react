/**
 * Default re-export for React.lazy() usage.
 *
 * Tier 1 — Always lazy (never in main bundle, loaded on first render).
 *
 * Usage:
 * ```ts
 * const CometChatStickersKeyboard = React.lazy(
 *   () => import('./CometChatStickersKeyboard.lazy')
 * );
 * ```
 */
export { CometChatStickersKeyboard as default } from './CometChatStickersKeyboard';
