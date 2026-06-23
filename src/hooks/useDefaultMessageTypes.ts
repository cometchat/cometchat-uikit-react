import { usePluginRegistry } from './usePluginRegistry';

/**
 * The default message types `CometChatMessageList` passes to the
 * `messagesRequestBuilder` via `setTypes(...)` when no custom `messageTypes`
 * prop is supplied.
 *
 * This is the live union of every active plugin's `messageTypes` — it reflects
 * custom plugins added via the provider's `plugins` prop and respects
 * `removePlugins`. It is the exact value MessageList uses by default, so a
 * custom request builder can stay in sync:
 *
 * ```tsx
 * const types = useDefaultMessageTypes();
 * const builder = new CometChat.MessagesRequestBuilder()
 *   .setTypes([...types, 'my_custom_type']);
 * ```
 *
 * @returns Deduplicated message types from the active plugin registry.
 * @throws Error if used outside a CometChatProvider.
 */
export function useDefaultMessageTypes(): string[] {
  return usePluginRegistry().getAllMessageTypes();
}

/**
 * The default message categories `CometChatMessageList` passes to the
 * `messagesRequestBuilder` via `setCategories(...)` when no custom
 * `messageCategories` prop is supplied.
 *
 * Live union of every active plugin's `messageCategories` — reflects custom
 * plugins and `removePlugins`. See {@link useDefaultMessageTypes}.
 *
 * @returns Deduplicated message categories from the active plugin registry.
 * @throws Error if used outside a CometChatProvider.
 */
export function useDefaultMessageCategories(): string[] {
  return usePluginRegistry().getAllMessageCategories();
}
