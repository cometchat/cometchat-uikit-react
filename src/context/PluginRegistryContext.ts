import { createContext } from 'react';
import type { CometChatPluginRegistry } from '../plugins/CometChatPluginRegistry';

/**
 * Context for the immutable plugin registry.
 *
 * Provided by CometChatProvider (future) or directly in tests via MockCometChatProvider.
 * Consumed by usePluginRegistry() and any component that needs to resolve
 * message types to plugins (e.g., CometChatMessageBubbleRenderer).
 *
 * that works with StrictMode and is testable in isolation.
 */
export const CometChatPluginRegistryContext = createContext<CometChatPluginRegistry | null>(null);

CometChatPluginRegistryContext.displayName = 'CometChatPluginRegistryContext';
