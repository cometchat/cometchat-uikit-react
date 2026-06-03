/**
 * Default re-export for React.lazy() usage.
 *
 * Tier 4 — Dialog lazy (loaded when user opens the AI assistant chat).
 * Preloaded on AI button hover/focus.
 *
 * Usage:
 * ```ts
 * const CometChatAIAssistantChat = React.lazy(
 *   () => import('./CometChatAIAssistantChat.lazy')
 * );
 * ```
 *
 * Preload on hover/focus:
 * ```ts
 * const preloadAIAssistantChat = () => import('./CometChatAIAssistantChat.lazy');
 *
 * <button
 *   onMouseEnter={preloadAIAssistantChat}
 *   onFocus={preloadAIAssistantChat}
 *   onClick={openChat}
 * >
 *   AI Assistant
 * </button>
 * ```
 */
export { CometChatAIAssistantChat as default } from './CometChatAIAssistantChat';
