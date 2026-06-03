/**
 * Default re-export for React.lazy() usage.
 *
 * Exports the Root component directly since React.lazy() requires
 * the default export to be a React component (not a compound object).
 *
 * Usage:
 * ```ts
 * const LazyCometChatFullScreenViewer = React.lazy(
 *   () => import('./CometChatFullScreenViewer.lazy')
 * );
 * // Mount conditionally: {show && <LazyCometChatFullScreenViewer onClose={...} />}
 * ```
 */
export { CometChatFullScreenViewerRoot as default } from './CometChatFullScreenViewerRoot';
