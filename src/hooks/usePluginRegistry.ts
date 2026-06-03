import { useContext } from 'react';
import { CometChatPluginRegistryContext } from '../context/PluginRegistryContext';
import type { CometChatPluginRegistry } from '../plugins/CometChatPluginRegistry';

/**
 * Read the plugin registry from context.
 *
 * Throws if used outside a provider — catches misconfiguration early
 * rather than silently returning null and failing later in renderBubble().
 *
 * @returns The immutable CometChatPluginRegistry instance.
 * @throws Error if no CometChatPluginRegistryContext provider is found.
 */
export function usePluginRegistry(): CometChatPluginRegistry {
  const registry = useContext(CometChatPluginRegistryContext);
  if (!registry) {
    throw new Error(
      'usePluginRegistry: no CometChatPluginRegistryContext found. ' +
        'Wrap your component tree in a CometChatProvider or provide the context directly.'
    );
  }
  return registry;
}
